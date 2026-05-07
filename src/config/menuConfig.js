import { lazy } from "react";

const menuConfig = [
  {
    path: "/helpdesk",
    component: lazy(() => import("../pages/helpdesk/HelpdeskPage")),
  },
];

export default menuConfig;
