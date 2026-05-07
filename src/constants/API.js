const API = {
  // tech lib
  GAD: {
    DashboardData: "/ILeap/GetGADDataSheetPaginated",
    GadCreateReq: "/ILeap/CreateGADRequest",
    ReferenceNumberList: "/ILeap/GetGADReferenceNumberBySearch",
    GetRequestNo: "/ILeap/GetNextGADRequestNo",
    AddVendors: "/ILeap/CreateGADVendorInfo",
    GadApprove: "/ILeap/GADApproveByApprover",
  },

  ProjectProfitability: {
    GetPendingProjects: "/ILeap/GetPendingProjects",
    GetProjectDetails: "/ILeap/GetProjectDetails",
    SaveProjectProfitability: "/ILeap/SaveProjectProfitability",
    GetPaginatedProjects: "/ILeap/GetPaginatedProjects",
    GetEstimatedProfitability: "/ILeap/GetEstimatedProfitability",
    GetMaterialCosts: "/ILeap/GetMaterialCosts",
    UpdateBudgetedCosts: "/ILeap/UpdateBudgetedCosts",
  },

  Helpdesk: {
    getTickets: "/ILeap/GetHDTickets",
    createITHelpdeskTicket: "/ILeap/CreateHDTicket",
    enrollTicket: "/ILeap/EnrollHDTicket",
    reassignTicket: "/ILeap/ReassignHDTicket",
    updateTicketStatus: "/ILeap/ChangeHDTicketStatus",
    sendStrike: "/ILeap/sendStrike",
    updateHistory: "/ILeap/AddHDHistory",
    getHistoryById: "/ILeap/GetHDHistory",
    getStrikes: "/ILeap/GetHDStrikes",
    respondStrike: "/ILeap/RespondHDStrike",
    addDiscussion: "/ILeap/AddHDDiscussion",
    getDiscussions: "/ILeap/GetHDDiscussions",
    GetHDCatalog: "/ILeap/GetHDCatalog",
    getTicketEmployees: "/ILeap/GetHDTicketEmployees",
  },

  // common
  FileDownload: {
    DownloadFile: "/ILeap/DownloadFile",
  },
};

export default API;
