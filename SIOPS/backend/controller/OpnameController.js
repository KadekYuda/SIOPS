import { Op } from "sequelize";
import { Opname, BatchStock, Product, User } from "../models/index.js";
import db from "../config/Database.js";

// Initialize associations
BatchStock.belongsTo(Product, { foreignKey: "code_product" });
Product.hasMany(BatchStock, { foreignKey: "code_product" });
Opname.belongsTo(BatchStock, { foreignKey: "batch_id" });
BatchStock.hasMany(Opname, { foreignKey: "batch_id" });
Opname.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Opname, { foreignKey: "user_id" });

export const createOpnameTasks = async (req, res) => {
  const { code_product, scheduled_date, assigned_user_id } = req.body;
  const transaction = await db.transaction();

  try {
    if (!code_product) {
      await transaction.rollback();
      return res.status(400).json({ error: "code_product is required" });
    }
    if (!scheduled_date) {
      await transaction.rollback();
      return res.status(400).json({ error: "scheduled_date is required" });
    }
    if (!assigned_user_id) {
      await transaction.rollback();
      return res.status(400).json({ error: "assigned_user_id is required" });
    }

    const batchStocks = await BatchStock.findAll({
      where: { code_product },
      transaction,
    });

    if (!batchStocks.length) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "No batches found for this product" });
    }

    const opnames = batchStocks.map((batch) => ({
      batch_id: batch.batch_id,
      user_id: assigned_user_id,
      scheduled_date,
      system_stock: batch.stock_quantity,
      status: "scheduled",
    }));

    await Opname.bulkCreate(opnames, { transaction });
    await transaction.commit();
    res
      .status(201)
      .json({ message: "Opname tasks created", count: opnames.length });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create opname tasks" });
  }
};

export const getTasksForUser = async (req, res) => {
  try {
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    console.log("Fetching tasks for user:", req.user.user_id);

    const tasks = await Opname.findAll({
      where: { user_id: req.user.user_id, status: ["scheduled", "in_progress"] },
      include: [
        {
          model: BatchStock,
          required: true,
          include: [{ model: Product, required: true }],
        },
      ],
      order: [["scheduled_date", "ASC"]],
    });

    console.log("Found tasks:", tasks.length);
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

export const submitOpnameResult = async (req, res) => {
  const { code_product, physical_stock, expired_stock, damaged_stock, notes } =
    req.body;
  const transaction = await db.transaction();

  try {
    if (physical_stock === undefined || physical_stock < 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "physical_stock is required and must be non-negative" });
    }

    const batches = await BatchStock.findAll({
      where: { code_product },
      order: [["createdAt", "ASC"]], // FIFO
      transaction,
    });

    const opnames = await Opname.findAll({
      where: {
        batch_id: { [Op.in]: batches.map((b) => b.batch_id) },
        user_id: req.user.id,
        status: ["scheduled", "in_progress"],
      },
      transaction,
    });

    if (!opnames.length) {
      await transaction.rollback();
      return res
        .status(403)
        .json({ error: "No opname found or not assigned to you" });
    }

    const currentDate = new Date().toISOString().split("T")[0];
    let remainingStock = parseInt(physical_stock);
    let remainingExpired = expired_stock ? parseInt(expired_stock) : 0;
    let remainingDamaged = damaged_stock ? parseInt(damaged_stock) : 0;
    let totalSystemStock = batches.reduce((sum, b) => sum + b.stock_quantity, 0);

    for (const batch of batches) {
      const opname = opnames.find((o) => o.batch_id === batch.batch_id);
      if (opname && remainingStock > 0) {
        const batchPhysicalStock = Math.min(batch.stock_quantity, remainingStock);
        const ratio = physical_stock > 0 ? batchPhysicalStock / physical_stock : 0;
        const status =
          currentDate >= opname.scheduled_date ? "submitted" : "in_progress";
        await opname.update(
          {
            physical_stock: batchPhysicalStock,
            expired_stock: Math.round(remainingExpired * ratio) || 0,
            damaged_stock: Math.round(remainingDamaged * ratio) || 0,
            notes: `${notes || ""} ${
              status === "in_progress" ? `(Saved on ${currentDate})` : ""
            }`,
            status: status,
            opname_date: status === "submitted" ? currentDate : null, // Set opname_date saat submitted
          },
          { transaction }
        );
        remainingStock -= batchPhysicalStock;
        remainingExpired -= Math.round(remainingExpired * ratio);
        remainingDamaged -= Math.round(remainingDamaged * ratio);
      }
    }

    if (remainingStock > 0 || remainingStock < 0) {
      await Opname.create(
        {
          user_id: req.user.id,
          system_stock: 0,
          physical_stock: 0,
          expired_stock: 0,
          damaged_stock: 0,
          notes: `Selisih stok: ${
            remainingStock > 0 ? `+${remainingStock}` : remainingStock
          } (Sistem: ${totalSystemStock})`,
          status: currentDate >= opname.scheduled_date ? "submitted" : "in_progress",
          scheduled_date: opnames[0].scheduled_date,
          opname_date:
            currentDate >= opname.scheduled_date ? currentDate : null,
        },
        { transaction }
      );
    }

    await transaction.commit();
    res.json({
      message: `Opname ${
        currentDate >= opname.scheduled_date ? "submitted" : "saved in progress"
      }`,
      status: currentDate >= opname.scheduled_date ? "submitted" : "in_progress",
    });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to submit opname" });
  }
};

export const reviewAndAdjustOpname = async (req, res) => {
  const { opname_id, adjustment_notes } = req.body;
  const transaction = await db.transaction();

  try {
    const opname = await Opname.findByPk(opname_id, { transaction });
    if (!opname || opname.status !== "submitted") {
      await transaction.rollback();
      return res
        .status(403)
        .json({ error: "Opname not found or not submitted" });
    }

    const batch = await BatchStock.findByPk(opname.batch_id, { transaction });
    if (batch) {
      await batch.update(
        { stock_quantity: opname.physical_stock },
        { transaction }
      );
    }

    await opname.update(
      {
        status: "adjusted",
        notes: adjustment_notes || opname.notes,
      },
      { transaction }
    );

    await transaction.commit();
    res.json({ message: "Opname reviewed and adjusted" });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to review and adjust opname" });
  }
};

export const directOpnameByAdmin = async (req, res) => {
  const { code_product, physical_stock, expired_stock, damaged_stock, notes } =
    req.body;
  const transaction = await db.transaction();

  try {
    if (physical_stock === undefined || physical_stock < 0) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ error: "physical_stock is required and must be non-negative" });
    }

    const batches = await BatchStock.findAll({
      where: { code_product },
      order: [["createdAt", "ASC"]], // FIFO
      transaction,
    });

    if (!batches.length) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "No batches found for this product" });
    }

    const currentDate = new Date().toISOString().split("T")[0];
    let remainingStock = parseInt(physical_stock);
    let remainingExpired = expired_stock ? parseInt(expired_stock) : 0;
    let remainingDamaged = damaged_stock ? parseInt(damaged_stock) : 0;

    for (const batch of batches) {
      if (remainingStock <= 0) break;
      const batchPhysicalStock = Math.min(batch.stock_quantity, remainingStock);
      const ratio = physical_stock > 0 ? batchPhysicalStock / physical_stock : 0;
      await Opname.create(
        {
          batch_id: batch.batch_id,
          user_id: req.user.id,
          scheduled_date: null, // Tidak ada jadwal untuk direct opname
          opname_date: currentDate,
          system_stock: batch.stock_quantity, // Stok sebelum perubahan
          physical_stock: batchPhysicalStock,
          expired_stock: Math.round(remainingExpired * ratio) || 0,
          damaged_stock: Math.round(remainingDamaged * ratio) || 0,
          notes: notes || "Direct opname pending",
          status: "pending",
        },
        { transaction }
      );
      remainingStock -= batchPhysicalStock;
      remainingExpired -= Math.round(remainingExpired * ratio);
      remainingDamaged -= Math.round(remainingDamaged * ratio);
    }

    if (remainingStock > 0 || remainingStock < 0) {
      await Opname.create(
        {
          user_id: req.user.id,
          scheduled_date: null,
          opname_date: currentDate,
          system_stock: 0,
          physical_stock: 0,
          expired_stock: 0,
          damaged_stock: 0,
          notes: `Selisih stok: ${
            remainingStock > 0 ? `+${remainingStock}` : remainingStock
          }`,
          status: "pending",
        },
        { transaction }
      );
    }

    await transaction.commit();
    res.json({ message: "Direct opname saved pending", date: currentDate });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to perform direct opname" });
  }
};

export const confirmDirectOpname = async (req, res) => {
  const { opname_date, pendingInputs } = req.body;
  const transaction = await db.transaction();

  try {
    // Process each pending input
    for (const input of pendingInputs) {
      const batches = await BatchStock.findAll({
        where: { code_product: input.code_product },
        transaction,
      });

      if (!batches.length) {
        await transaction.rollback();
        return res.status(404).json({ error: `No batches found for product ${input.code_product}` });
      }

      // Create opname record for each batch
      await Promise.all(batches.map(async (batch) => {        await Opname.create({
          batch_id: batch.batch_id,
          user_id: req.user.user_id,
          scheduled_date: null,
          opname_date: input.date,
          system_stock: batch.stock_quantity,
          physical_stock: input.physical_stock,
          expired_stock: input.expired_stock || 0,
          damaged_stock: input.damaged_stock || 0,
          notes: input.notes,
          status: "adjusted"
        }, { transaction });

        // Update batch stock
        await batch.update({
          stock_quantity: input.physical_stock
        }, { transaction });
      }));
    }

    await transaction.commit();
    res.json({ message: "Direct opname confirmed successfully" });
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to confirm direct opname" });
  }
};

export const getAllOpnames = async (req, res) => {
  try {
    const opnames = await Opname.findAll({
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'email', 'role']
        },
        {
          model: BatchStock,
          include: [{
            model: Product,
            attributes: ['code_product', 'name_product', 'code_categories']
          }]
        }
      ],
      order: [['scheduled_date', 'DESC']]
    });

    // Transform and send opname data
    const transformedOpnames = opnames.map(opname => ({
      ...opname.toJSON(),
      is_direct: !opname.scheduled_date // Mark as direct opname if no scheduled date
    }));

    res.json(transformedOpnames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch opnames" });
  }
};

// Fungsi untuk memperbarui status otomatis (bisa dijalankan via cron)
export const autoSubmitOpnames = async () => {
  const currentDate = new Date().toISOString().split("T")[0];
  const opnames = await Opname.findAll({ where: { status: "in_progress" } });
  for (const opname of opnames) {
    if (currentDate >= opname.scheduled_date) {
      await opname.update({
        status: "submitted",
        opname_date: currentDate,
      });
    }
  }
};