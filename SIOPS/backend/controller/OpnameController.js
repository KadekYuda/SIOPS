// backend/controllers/opnameController.js
import { Op } from 'sequelize';
import { Opname, BatchStock, Product, User } from '../models/index.js';
import db from '../config/Database.js';

// Initialize associations
BatchStock.belongsTo(Product, { foreignKey: 'code_product' });
Product.hasMany(BatchStock, { foreignKey: 'code_product' });
Opname.belongsTo(BatchStock, { foreignKey: 'batch_id' });
BatchStock.hasMany(Opname, { foreignKey: 'batch_id' });
Opname.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Opname, { foreignKey: 'user_id' });

export const createOpnameTasks = async (req, res) => {
  const { batch_ids, scheduled_date, assigned_user_id, category } = req.body;
  const transaction = await db.transaction();

  try {
    if (!batch_ids && !category) {
      await transaction.rollback();
      return res.status(400).json({ error: 'batch_ids or category is required' });
    }
    if (!scheduled_date) {
      await transaction.rollback();
      return res.status(400).json({ error: 'scheduled_date is required' });
    }
    if (!assigned_user_id) {
      await transaction.rollback();
      return res.status(400).json({ error: 'assigned_user_id is required' });
    }

    const where = batch_ids ? { batch_id: { [Op.in]: batch_ids } } : { '$product.category$': category };
    const batchStocks = await BatchStock.findAll({
      where,
      include: [{ model: Product }],
      transaction,
    });

    if (!batchStocks.length) {
      await transaction.rollback();
      return res.status(404).json({ error: 'No batches found' });
    }

    const opnames = batchStocks.map(batch => ({
      batch_id: batch.batch_id,
      user_id: assigned_user_id,
      scheduled_date,
      system_stock: batch.stock_quantity,
      status: 'scheduled',
    }));

    await Opname.bulkCreate(opnames, { transaction });
    await transaction.commit();
    res.status(201).json({ message: 'Opname tasks created', count: opnames.length });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create opname tasks' });
  }
};

export const getTasksForUser = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Fetching tasks for user:', req.user.user_id);

    const tasks = await Opname.findAll({
      where: { 
        user_id: req.user.user_id,
        status: 'scheduled'
      },
      include: [
        {
          model: BatchStock,
          required: true,
          include: [{
            model: Product,
            required: true
          }]
        }
      ],
      order: [['scheduled_date', 'ASC']]
    });

    console.log('Found tasks:', tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const submitOpnameResult = async (req, res) => {
  const { physical_stock, expired_stock, damaged_stock, notes } = req.body;
  const transaction = await db.transaction();

  try {
    if (physical_stock === undefined || physical_stock < 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'physical_stock is required and must be non-negative' });
    }

    const opname = await Opname.findByPk(req.params.id, { transaction });
    if (!opname || opname.status !== 'scheduled' || opname.user_id !== req.user.id) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Opname not found, not scheduled, or not assigned to you' });
    }

    await opname.update({
      physical_stock,
      expired_stock: expired_stock || 0,
      damaged_stock: damaged_stock || 0,
      notes,
      status: 'submitted',
    }, { transaction });

    await transaction.commit();
    res.json({ message: 'Opname submitted' });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to submit opname' });
  }
};

export const reviewAndAdjustOpname = async (req, res) => {
  const { opname_id, adjustment_notes } = req.body;
  const transaction = await db.transaction();

  try {
    const opname = await Opname.findByPk(opname_id, { transaction });
    if (!opname || opname.status !== 'submitted') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Opname not found or not submitted' });
    }

    // Logika penyesuaian stok (misalnya, update BatchStock)
    const batchStock = await BatchStock.findByPk(opname.batch_id, { transaction });
    if (batchStock) {
      await batchStock.update({
        stock_quantity: opname.physical_stock, // Atau logika penyesuaian lain
      }, { transaction });
    }

    await opname.update({
      status: 'adjusted',
      notes: adjustment_notes || opname.notes,
    }, { transaction });

    await transaction.commit();
    res.json({ message: 'Opname reviewed and adjusted' });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to review and adjust opname' });
  }
};

export const getAllOpnames = async (req, res) => {
  try {
    const opnames = await Opname.findAll({
      include: [User, BatchStock],
    });
    res.json(opnames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch opnames' });
  }
};