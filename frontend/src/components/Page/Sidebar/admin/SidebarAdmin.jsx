import clsx from "clsx";
import LinkItem from "../staff/LinkItem";
import  { Fiturs } from "./fiturAdmin"
const SidebarAdmin = ({ isSidebarOpen }) => {
    return (
        <aside
            className={clsx(
                "fixed top-0 left-0 z-40 w-64  h-screen pt-20",
                "bg-white border-r border-gray-200  ",
                "dark:bg-gray-800 dark:border-gray-700",
                "transition-transform mt-2 dark:text-white",
                {
                    "translate-x-0": isSidebarOpen,
                    "-translate-x-full": !isSidebarOpen
                }
            )}
        >
           <div className="h-full px-3 pb-4 overflow-y-auto">
            <ul className="space-y-2 font-medium">
                {Fiturs.map((link, index)=>(
                       <LinkItem key={index} {...link}/> 
                    ))
                }
            </ul>
           </div>
        </aside>
    );
};

export default SidebarAdmin;