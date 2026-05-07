// HelpdeskPage.jsx — API-bound Helpdesk (IT + HR)
// Session user: localStorage key "user" → { emp_Id, emp_Name, emp_No, dept_Id, org_Id, ... }
// dept_Id 7 = IT | dept_Id 5 = HR | others = normal User

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BellOff,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock3,
  Database,
  FlaskConical,
  HardDrive,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MessageSquareText,
  Paperclip,
  PlayCircle,
  Plus,
  Send,
  Timer,
  User,
  UserCheck,
  Users,
  WifiOff,
  Wrench,
  X,
  XCircle,
  Zap,
  ClipboardList,
  ArrowLeftRight,
  RefreshCw,
  Tag,
  Briefcase,
  EyeOff,
  Filter,
  List,
  TestTube,
  SquareArrowOutUpRight,
} from "lucide-react";
import ITHelpdeskService from "../../services/helpdesk/HelpdeskService";
import HelpdeskService from "../../services/helpdesk/HelpdeskService";

// ─── SESSION USER ─────────────────────────────────────────────────────────────
function getSessionUser() {
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// dept_Id 7 = IT, 5 = HR
function deriveRole(deptId) {
  if (deptId === 7) return "IT";
  if (deptId === 5) return "HR";
  return "User";
}

// ─── CATALOG CACHE KEY ────────────────────────────────────────────────────────
const CATALOG_CACHE_KEY = "enlife_hd_catalog_v2";

// ─── CATEGORY / STATUS META ───────────────────────────────────────────────────
const CATEGORY_META = {
  software: {
    label: "Software",
    Icon: Zap,
    pill: "bg-violet-50 text-violet-700 border-violet-200",
    statuses: [
      "Open",
      "Requirement",
      "Discussion",
      "In Progress",
      "IT Testing",
      "Ready for Demo",
      "User Testing",
      "Waiting for User Input",
      "Closed",
    ],
    flowType: "full",
  },
  erp: {
    label: "ERP Enhancement",
    Icon: Database,
    pill: "bg-cyan-50 text-cyan-700 border-cyan-200",
    statuses: [
      "Open",
      "Requirement",
      "Discussion",
      "In Progress",
      "IT Testing",
      "Ready for Demo",
      "User Testing",
      "Waiting for User Input",
      "Closed",
    ],
    flowType: "full",
  },
  hardware: {
    label: "Hardware",
    Icon: HardDrive,
    pill: "bg-amber-50 text-amber-700 border-amber-200",
    statuses: ["Open", "In Progress", "Waiting for User Input", "Closed"],
    flowType: "simple",
  },
  networking: {
    label: "Networking",
    Icon: WifiOff,
    pill: "bg-orange-50 text-orange-700 border-orange-200",
    statuses: ["Open", "In Progress", "Waiting for User Input", "Closed"],
    flowType: "simple",
  },
};

const HR_STATUSES = ["Open", "Queue", "Assigned", "In Progress", "Closed"];
const FULL_FLOW_CATEGORIES = ["software", "erp"];
const TESTING_STATUSES = ["IT Testing", "Ready for Demo", "User Testing"];

const STATUS_META = {
  Open: {
    dot: "bg-slate-400",
    txt: "text-slate-600",
    chip: "bg-slate-100 text-slate-600",
    Icon: Inbox,
  },
  Requirement: {
    dot: "bg-blue-400",
    txt: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
    Icon: ClipboardList,
  },
  Discussion: {
    dot: "bg-purple-400",
    txt: "text-purple-700",
    chip: "bg-purple-100 text-purple-700",
    Icon: MessageSquareText,
  },
  Queue: {
    dot: "bg-indigo-400",
    txt: "text-indigo-700",
    chip: "bg-indigo-100 text-indigo-700",
    Icon: List,
  },
  Assigned: {
    dot: "bg-blue-400",
    txt: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
    Icon: UserCheck,
  },
  "In Progress": {
    dot: "bg-blue-500",
    txt: "text-blue-700",
    chip: "bg-blue-100 text-blue-700",
    Icon: Clock3,
  },
  "On Hold": {
    dot: "bg-amber-500",
    txt: "text-amber-700",
    chip: "bg-amber-100 text-amber-700",
    Icon: AlertCircle,
  },
  "Waiting for User Input": {
    dot: "bg-orange-500",
    txt: "text-orange-700",
    chip: "bg-orange-100 text-orange-700",
    Icon: Timer,
  },
  "IT Testing": {
    dot: "bg-indigo-500",
    txt: "text-indigo-700",
    chip: "bg-indigo-100 text-indigo-700",
    Icon: FlaskConical,
  },
  "Ready for Demo": {
    dot: "bg-teal-500",
    txt: "text-teal-700",
    chip: "bg-teal-100 text-teal-700",
    Icon: PlayCircle,
  },
  "User Testing": {
    dot: "bg-amber-400",
    txt: "text-amber-700",
    chip: "bg-amber-100 text-amber-700",
    Icon: TestTube,
  },
  Closed: {
    dot: "bg-slate-300",
    txt: "text-slate-400",
    chip: "bg-slate-100 text-slate-400",
    Icon: XCircle,
  },
};

const PRIORITIES = ["Critical", "Medium", "Normal"];
const TICKET_TYPES = ["Service Request", "Incident"];

const HOLD_REASON_OPTIONS = [
  { value: "response_not_received", label: "Response Not Received" },
  { value: "pending_approval", label: "Pending Approval" },
  { value: "vendor_dependency", label: "Vendor Dependency" },
  { value: "other", label: "Other Issue" },
];

const PRIORITY_PILL = {
  Critical: "bg-red-100 text-red-700 border border-red-200",
  Medium: "bg-amber-100 text-amber-700 border border-amber-200",
  Normal: "bg-blue-100 text-blue-700 border border-blue-200",
};

const ORG_PILL = {
  IML: "bg-blue-100 text-blue-700 border border-blue-200",
  CSIL: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Daedalus: "bg-purple-100 text-purple-700 border border-purple-200",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (d) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
};
const daysBetween = (a, b) => {
  const d1 = new Date(a);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(b);
  d2.setHours(0, 0, 0, 0);
  return Math.ceil((d2 - d1) / 86400000);
};
const getCatMeta = (id) => CATEGORY_META[id] || CATEGORY_META.software;
const getCatMetaFromStr = (catStr) => {
  // category is stored as "parentName,categoryName,subCategory"
  const parts = (catStr || "").split(",");
  const derived = deriveCategory(parts[0] || "", parts[1] || "");
  return getCatMeta(derived);
};

// Map assignees stored as comma-separated string → array
const parseAssignees = (str) =>
  str
    ? str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
const joinAssignees = (arr) => (arr || []).join(",");

// Parse category string "parentName,categoryName,subCategory"
const parseCategoryStr = (str) => {
  const parts = (str || "").split(",");
  return {
    catalogParent: parts[0] || "",
    catalogCategory: parts[1] || "",
    catalogSubCategory: parts[2] || "",
  };
};
const buildCategoryStr = (parent, category, sub) =>
  [parent, category, sub].filter(Boolean).join(",");

function deriveCategory(parentName, categoryName) {
  const p = (parentName || "").toLowerCase();
  const c = (categoryName || "").toLowerCase();
  if (p.includes("hardware")) return "hardware";
  if (p.includes("network")) return "networking";
  if (p.includes("erp") || c.includes("erp") || c.includes("enhancement"))
    return "erp";
  return "software";
}

function etaBadge(etaDate, status) {
  if (status === "Closed")
    return {
      label: "Closed",
      cls: "bg-slate-100 text-slate-500 border border-slate-200",
    };
  if (!etaDate)
    return {
      label: "No ETA",
      cls: "bg-slate-100 text-slate-500 border border-slate-200",
    };
  const d = daysBetween(todayISO(), etaDate.slice?.(0, 10) || etaDate);
  if (d < 0)
    return {
      label: `Overdue ${Math.abs(d)}d`,
      cls: "bg-red-100 text-red-700 border border-red-200",
    };
  if (d === 0)
    return {
      label: "Due today",
      cls: "bg-orange-100 text-orange-700 border border-orange-200",
    };
  if (d <= 7)
    return {
      label: `${d}d left`,
      cls: "bg-amber-100 text-amber-700 border border-amber-200",
    };
  return {
    label: `${d}d left`,
    cls: "bg-slate-100 text-slate-600 border border-slate-200",
  };
}

function getStrikeGroups(strikes = []) {
  if (!strikes.length) return [];
  const groups = [];
  let cur = [];
  for (const s of strikes) {
    cur.push(s);
    if (cur.length === 3 && cur.every((x) => x.response_Received)) {
      groups.push([...cur]);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
}

// ─── MAP API TICKET → UI TICKET ───────────────────────────────────────────────
function mapApiTicket(t) {
  const catParsed = parseCategoryStr(t.category || "");
  const derived = deriveCategory(
    catParsed.catalogParent,
    catParsed.catalogCategory,
  );
  return {
    id: t.ticket_Id,
    ticketNo: t.ticket_No || "",
    ticketDept: t.dept || "IT",
    description: t.description || "",
    category: derived,
    catalogParent: catParsed.catalogParent,
    catalogCategory: catParsed.catalogCategory,
    catalogSubCategory: catParsed.catalogSubCategory,
    submittedBy: t.submitted_By_Name || "",
    submittedByEmpId: String(t.submitted_By || ""),
    onBehalfOf: "",
    priority: t.priority || null,
    ticketType: t.req_Type || null,
    requestType: t.req_Type || null,
    impact: t.impact || "user",
    status: t.status || "Open",
    submittedDate: t.submitted_At ? t.submitted_At.slice(0, 10) : todayISO(),
    itStartDate: t.start_Date ? t.start_Date.slice(0, 10) : null,
    etaDate: t.eta_Date ? t.eta_Date.slice(0, 10) : null,
    etaHours: t.eta_Time || null,
    closingDate: null,
    closingNote: "",
    holdRemarks: "",
    holdReasonType: "",
    attachment: t.file_Name
      ? { name: t.file_Name, size: "", path: t.file_Path }
      : null,
    type: t.ticket_Type === "linked" ? "Linked Ticket" : "Ticket",
    parentId: t.parent_Ticket_Id || null,
    linkedTaskIds: [],
    enrolledByIT: t.status !== "Open",
    itAssignees: parseAssignees(t.assigned_Person_Name || ""),
    itAssigneeIds: parseAssignees(String(t.assigned_Person || "")),
    itRemarks: t.remarks || "",
    org: t.org_Id || t.org || "IML",
    messages: [],
    strikes: [],
    statusHistory: [],
    autoClosedAfterStrikes: false,
  };
}

// ─── CATALOG PARSE ────────────────────────────────────────────────────────────
function parseCatalog(items) {
  const itIncident = {},
    itService = {},
    hr = {};
  for (const item of items) {
    const { parentName, category, subCategory, reqType } = item;
    let bucket;
    if (reqType === "IT Incident") bucket = itIncident;
    else if (reqType === "IT Service") bucket = itService;
    else if (reqType === "HR") bucket = hr;
    else continue;
    if (!bucket[parentName]) bucket[parentName] = {};
    if (!bucket[parentName][category]) bucket[parentName][category] = [];
    if (subCategory) bucket[parentName][category].push(subCategory);
  }
  const toTree = (bucket) =>
    Object.entries(bucket).map(([parentName, cats]) => ({
      parentName,
      categories: Object.entries(cats).map(([name, subCategories]) => ({
        name,
        subCategories,
      })),
    }));
  return {
    itIncident: toTree(itIncident),
    itService: toTree(itService),
    hr: toTree(hr),
  };
}

// ─── NESTED CATALOG DROPDOWN ──────────────────────────────────────────────────
function NestedCatalogDropdown({
  tree,
  value,
  onChange,
  loading,
  accentColor = "slate",
}) {
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const catRef = useRef(null),
    subRef = useRef(null),
    itemRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (catRef.current && !catRef.current.contains(e.target))
        setCatOpen(false);
      if (subRef.current && !subRef.current.contains(e.target))
        setSubOpen(false);
      if (itemRef.current && !itemRef.current.contains(e.target))
        setItemOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const acc = {
    focus:
      accentColor === "indigo"
        ? "focus:border-indigo-400"
        : "focus:border-slate-400",
    hover:
      accentColor === "indigo" ? "hover:bg-indigo-50" : "hover:bg-slate-50",
    selected:
      accentColor === "indigo"
        ? "bg-indigo-50 text-indigo-700"
        : "bg-blue-50 text-blue-700",
    check: accentColor === "indigo" ? "text-indigo-500" : "text-blue-500",
  };

  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading catalog…
      </div>
    );
  if (!tree.length)
    return (
      <div className="text-xs text-slate-400 py-2 italic">
        No catalog items available.
      </div>
    );

  const allParents = tree.map((p) => p.parentName);
  const selectedParentObj = tree.find((p) => p.parentName === value.parentName);
  const allCategories = selectedParentObj?.categories || [];
  const isRootMode =
    allCategories.length === 1 && allCategories[0].name === value.parentName;
  const selectedCatObj = isRootMode
    ? allCategories[0]
    : allCategories.find((c) => c.name === value.categoryName);
  const allSubCats = (selectedCatObj?.subCategories || []).filter(
    (s) => s !== "Text Box",
  );

  const handleParentSelect = (p) => {
    const parentObj = tree.find((x) => x.parentName === p);
    const cats = parentObj?.categories || [];
    const isRoot = cats.length === 1 && cats[0].name === p;
    onChange({ parentName: p, categoryName: isRoot ? p : "", subCategory: "" });
    setCatOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Level 1 */}
      <div ref={catRef} className="relative">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
          Category
        </label>
        <button
          type="button"
          onClick={() => {
            setCatOpen((p) => !p);
            setSubOpen(false);
            setItemOpen(false);
          }}
          className={`w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none transition-colors ${acc.focus} hover:border-slate-400`}
        >
          <span
            className={
              value.parentName
                ? "text-slate-800 font-semibold"
                : "text-slate-400"
            }
          >
            {value.parentName || "Select category…"}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${catOpen ? "rotate-180" : ""}`}
          />
        </button>
        {catOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto thin-scroll">
            {allParents.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleParentSelect(p)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${value.parentName === p ? acc.selected + " font-bold" : "text-slate-700 " + acc.hover}`}
              >
                <span>{p}</span>
                {value.parentName === p && (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${acc.check}`} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Level 2 */}
      {value.parentName && !isRootMode && allCategories.length > 0 && (
        <div ref={subRef} className="relative">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Sub-type
          </label>
          <button
            type="button"
            onClick={() => {
              setSubOpen((p) => !p);
              setItemOpen(false);
            }}
            className={`w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none transition-colors ${acc.focus} hover:border-slate-400`}
          >
            <span
              className={
                value.categoryName
                  ? "text-slate-800 font-semibold"
                  : "text-slate-400"
              }
            >
              {value.categoryName || "Select sub-type…"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${subOpen ? "rotate-180" : ""}`}
            />
          </button>
          {subOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto thin-scroll">
              {allCategories.map((c) => {
                const visibleSubs = c.subCategories.filter(
                  (s) => s !== "Text Box",
                );
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...value,
                        categoryName: c.name,
                        subCategory: "",
                      });
                      setSubOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${value.categoryName === c.name ? acc.selected + " font-bold" : "text-slate-700 " + acc.hover}`}
                  >
                    <span className="flex-1 min-w-0 truncate">{c.name}</span>
                    <div className="flex items-center gap-1.5 flex-none ml-2">
                      {visibleSubs.length > 0 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {visibleSubs.length} items
                        </span>
                      )}
                      {value.categoryName === c.name && (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${acc.check}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Level 3 */}
      {(value.categoryName || (isRootMode && value.parentName)) &&
        allSubCats.length > 0 && (
          <div ref={itemRef} className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Specific item
            </label>
            <button
              type="button"
              onClick={() => setItemOpen((p) => !p)}
              className={`w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none transition-colors ${acc.focus} hover:border-slate-400`}
            >
              <span
                className={
                  value.subCategory
                    ? "text-slate-800 font-semibold"
                    : "text-slate-400"
                }
              >
                {value.subCategory || "Select specific item… (optional)"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${itemOpen ? "rotate-180" : ""}`}
              />
            </button>
            {itemOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto thin-scroll">
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...value, subCategory: "" });
                    setItemOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 text-left text-sm transition-colors border-b border-slate-100 ${!value.subCategory ? acc.selected + " font-bold" : "text-slate-400 " + acc.hover} italic`}
                >
                  None / Not sure
                </button>
                {allSubCats.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, subCategory: sub });
                      setItemOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${value.subCategory === sub ? acc.selected + " font-bold" : "text-slate-700 " + acc.hover}`}
                  >
                    <span>{sub}</span>
                    {value.subCategory === sub && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${acc.check}`} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Breadcrumb */}
      {value.parentName && (
        <div className="flex items-center gap-1 flex-wrap pt-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {value.parentName}
          </span>
          {value.categoryName && value.categoryName !== value.parentName && (
            <>
              <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {value.categoryName}
              </span>
            </>
          )}
          {value.subCategory && (
            <>
              <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                {value.subCategory}
              </span>
            </>
          )}
          <button
            onClick={() =>
              onChange({ parentName: "", categoryName: "", subCategory: "" })
            }
            className="ml-auto text-[10px] text-slate-400 hover:text-red-500 font-semibold"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ASSIGNEE DROPDOWN (uses API employees) ────────────────────────────────────
function AssigneeDropdown({
  value,
  onChange,
  label = "Assign Engineers",
  error,
  employees = [],
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggle = (emp) => {
    const exists = value.find((v) => v.emp_Id === emp.emp_Id);
    onChange(
      exists ? value.filter((v) => v.emp_Id !== emp.emp_Id) : [...value, emp],
    );
  };
  const selectedNames = value.map((v) => v.emp_Name).join(", ");
  return (
    <Field label={label} error={error}>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="w-full h-10 flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none hover:border-slate-400 transition-colors"
        >
          <span
            className={
              value.length === 0
                ? "text-slate-400"
                : "text-slate-800 font-semibold"
            }
          >
            {value.length === 0 ? "Select engineers…" : selectedNames}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto thin-scroll">
            {employees.length === 0 && (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">
                No engineers found
              </div>
            )}
            {employees.map((emp) => {
              const sel = !!value.find((v) => v.emp_Id === emp.emp_Id);
              const initials = emp.emp_Name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <button
                  key={emp.emp_Id}
                  type="button"
                  onClick={() => toggle(emp)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 ${sel ? "bg-blue-50" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-none ${sel ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`font-semibold ${sel ? "text-blue-700" : "text-slate-700"}`}
                    >
                      {emp.emp_Name}
                    </span>
                    <span className="ml-1 text-[10px] font-bold mono text-slate-400">
                      #{emp.emp_No}
                    </span>
                    <span
                      className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ORG_PILL[emp.org_Id] || "bg-slate-100 text-slate-600"}`}
                    >
                      {emp.org_Id}
                    </span>
                  </span>
                  {sel && (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Field>
  );
}

// ─── SHARED UI PRIMITIVES ─────────────────────────────────────────────────────
const ACCENT_CLS = {
  amber: "border-amber-200 bg-amber-50/70",
  emerald: "border-emerald-200 bg-emerald-50/70",
  red: "border-red-200 bg-red-50/70",
};
function Section({ title, subtitle, accent, children }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${ACCENT_CLS[accent] || "border-slate-200 bg-slate-50"}`}
    >
      <p className="text-sm font-extrabold text-slate-900">{title}</p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
        {value}
      </p>
    </div>
  );
}
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>
      )}
    </div>
  );
}
function HRPill({ small = false }) {
  if (small)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 flex-none">
        <Briefcase className="w-2.5 h-2.5" />
        HR
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
      <Briefcase className="w-3 h-3" />
      HR
    </span>
  );
}

// ─── CREATE IT MODAL ──────────────────────────────────────────────────────────
function CreateITModal({
  catalogTree,
  catalogLoading,
  currentUser,
  onClose,
  onSubmit,
  submitting,
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    requestType: "Service Request",
    catalogValue: { parentName: "", categoryName: "", subCategory: "" },
    type: "Ticket",
    parentId: "",
    description: "",
    attachment: null,
  });
  const [errors, setErrors] = useState({});

  const activeCatalogTree = useMemo(
    () =>
      form.requestType === "Incident"
        ? catalogTree.itIncident || []
        : catalogTree.itService || [],
    [form.requestType, catalogTree],
  );

  const validate = () => {
    const errs = {};
    if (!form.catalogValue.parentName)
      errs.catalog = "Please select a category.";
    if (!form.description.trim()) errs.description = "Description required.";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const catStr = buildCategoryStr(
      form.catalogValue.parentName,
      form.catalogValue.categoryName,
      form.catalogValue.subCategory,
    );
    onSubmit({
      ticketDept: "IT",
      description: form.description.trim(),
      categoryStr: catStr,
      requestType: form.requestType,
      ticketType: form.requestType,
      impact: "user",
      type: form.type,
      parentId:
        form.type === "Linked Ticket" && form.parentId
          ? Number(form.parentId)
          : null,
      attachment: form.attachment,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: "540px" }}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-none">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-700" />
              Raise IT Ticket
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitting as{" "}
              <span className="font-bold text-slate-700">
                {currentUser.emp_Name}
              </span>{" "}
              · #{currentUser.emp_No}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto thin-scroll flex-1 p-6 space-y-5">
          {/* Request Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Request Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "Service Request",
                  label: "Service Request",
                  desc: "New requirements, installations, access",
                  Icon: Zap,
                  active: "border-sky-500 bg-sky-50 ring-2 ring-sky-200",
                  idle: "border-sky-200 bg-sky-50/50 hover:bg-sky-50",
                  iconCls: "text-sky-600",
                  labelCls: "text-sky-900",
                  descCls: "text-sky-600",
                },
                {
                  value: "Incident",
                  label: "Incident",
                  desc: "Something broken or not working",
                  Icon: AlertCircle,
                  active: "border-red-500 bg-red-50 ring-2 ring-red-200",
                  idle: "border-red-200 bg-red-50/50 hover:bg-red-50",
                  iconCls: "text-red-600",
                  labelCls: "text-red-900",
                  descCls: "text-red-600",
                },
              ].map((rt) => {
                const isSel = form.requestType === rt.value;
                return (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        requestType: rt.value,
                        catalogValue: {
                          parentName: "",
                          categoryName: "",
                          subCategory: "",
                        },
                      }))
                    }
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${isSel ? rt.active : rt.idle + " border-transparent"}`}
                  >
                    <rt.Icon
                      className={`w-5 h-5 flex-none mt-0.5 ${isSel ? rt.iconCls : "text-slate-400"}`}
                    />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold leading-tight ${isSel ? rt.labelCls : "text-slate-800"}`}
                      >
                        {rt.label}
                      </p>
                      <p
                        className={`text-[11px] mt-0.5 leading-tight ${isSel ? rt.descCls : "text-slate-500"}`}
                      >
                        {rt.desc}
                      </p>
                    </div>
                    {isSel && (
                      <CheckCircle2
                        className={`w-4 h-4 flex-none ml-auto ${rt.iconCls}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Select Category
            </label>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
              <NestedCatalogDropdown
                tree={activeCatalogTree}
                value={form.catalogValue}
                onChange={(v) => setForm((p) => ({ ...p, catalogValue: v }))}
                loading={catalogLoading}
              />
            </div>
            {errors.catalog && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">
                {errors.catalog}
              </p>
            )}
          </div>

          {/* Description */}
          <Field
            label="Description / Request Details"
            error={errors.description}
          >
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Clearly describe the request, affected system, scope, and urgency."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 resize-none"
            />
          </Field>

          {/* Attachment */}
          <Field label="Attachment (optional)">
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 rounded-xl border-2 border-dashed cursor-pointer px-4 py-3 transition-all ${form.attachment ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"}`}
            >
              <Paperclip
                className={`w-4 h-4 flex-none ${form.attachment ? "text-blue-500" : "text-slate-400"}`}
              />
              {form.attachment ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-700 truncate">
                    {form.attachment.name}
                  </p>
                  <p className="text-xs text-blue-400 mono">
                    {(form.attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Click to attach
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    PDF, DOCX, XLSX, images
                  </p>
                </div>
              )}
              {form.attachment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((p) => ({ ...p, attachment: null }));
                  }}
                  className="p-1 rounded text-blue-400 hover:text-blue-600 flex-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setForm((p) => ({ ...p, attachment: f }));
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </Field>
        </div>

        <div className="flex-none border-t border-slate-100 px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Submitted as{" "}
            <span className="font-semibold text-slate-600">
              {currentUser.emp_Name}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Raise IT Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE HR MODAL ──────────────────────────────────────────────────────────
function CreateHRModal({
  catalogTree,
  catalogLoading,
  currentUser,
  onClose,
  onSubmit,
  submitting,
}) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    catalogValue: { parentName: "", categoryName: "", subCategory: "" },
    description: "",
    attachment: null,
  });
  const [errors, setErrors] = useState({});
  const hrTree = catalogTree.hr || [];

  const validate = () => {
    const errs = {};
    if (!form.description.trim()) errs.description = "Description required.";
    if (!form.catalogValue.parentName)
      errs.catalog = "Please select a category.";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const catStr = buildCategoryStr(
      form.catalogValue.parentName,
      form.catalogValue.categoryName,
      form.catalogValue.subCategory,
    );
    onSubmit({
      ticketDept: "HR",
      description: form.description.trim(),
      categoryStr: catStr,
      requestType: "Service Request",
      ticketType: "Service Request",
      impact: "general_inquiry",
      type: "Ticket",
      parentId: null,
      attachment: form.attachment,
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: "540px" }}>
        <div className="flex items-center justify-between border-b border-indigo-100 px-6 py-4 flex-none bg-indigo-50/50">
          <div>
            <h2 className="text-base font-extrabold text-indigo-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              Raise HR Ticket
            </h2>
            <p className="text-xs text-indigo-400 mt-0.5">
              Submitting as{" "}
              <span className="font-bold text-indigo-700">
                {currentUser.emp_Name}
              </span>{" "}
              · #{currentUser.emp_No}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto thin-scroll flex-1 p-6 space-y-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Select HR Category
            </p>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3">
              <NestedCatalogDropdown
                tree={hrTree}
                value={form.catalogValue}
                onChange={(v) => setForm((p) => ({ ...p, catalogValue: v }))}
                loading={catalogLoading}
                accentColor="indigo"
              />
            </div>
            {errors.catalog && (
              <p className="mt-1.5 text-xs text-red-600 font-semibold">
                {errors.catalog}
              </p>
            )}
          </div>

          <Field
            label="Description / Request Details"
            error={errors.description}
          >
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Describe the HR request, employee name, and relevant details."
              className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
            />
          </Field>

          <Field label="Attachment (optional)">
            <div
              onClick={() => fileRef.current?.click()}
              className={`flex items-center gap-3 rounded-xl border-2 border-dashed cursor-pointer px-4 py-3 transition-all ${form.attachment ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50"}`}
            >
              <Paperclip
                className={`w-4 h-4 flex-none ${form.attachment ? "text-indigo-500" : "text-slate-400"}`}
              />
              {form.attachment ? (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-indigo-700 truncate">
                    {form.attachment.name}
                  </p>
                  <p className="text-xs text-indigo-400 mono">
                    {(form.attachment.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    Click to attach
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    PDF, DOCX, images
                  </p>
                </div>
              )}
              {form.attachment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setForm((p) => ({ ...p, attachment: null }));
                  }}
                  className="p-1 rounded text-indigo-400 hover:text-indigo-600 flex-none"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setForm((p) => ({ ...p, attachment: f }));
              }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
            />
          </Field>
        </div>

        <div className="flex-none border-t border-indigo-100 px-6 py-4 flex items-center justify-between gap-3 bg-indigo-50/30">
          <p className="text-xs text-indigo-400">
            Submitted as{" "}
            <span className="font-semibold text-indigo-700">
              {currentUser.emp_Name}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="h-10 px-5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Raise HR Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TICKET CARD (Kanban) ─────────────────────────────────────────────────────
function TicketCard({ ticket, active, onClick, currentUser }) {
  const isHRTicket = ticket.ticketDept === "HR";
  const cat =
    !isHRTicket && ticket.category ? getCatMeta(ticket.category) : null;
  const badge = etaBadge(ticket.etaDate, ticket.status);
  const groups = getStrikeGroups(ticket.strikes || []);
  const ag =
    groups.length > 0 &&
    !groups[groups.length - 1].every((s) => s.response_Received)
      ? groups[groups.length - 1]
      : null;
  const isAssigned =
    currentUser && ticket.itAssignees?.includes(currentUser.emp_Name);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-2.5 text-left shadow-sm transition-all duration-150 ${active ? "border-slate-800 ring-2 ring-slate-200 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow"}`}
    >
      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
        <span
          className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-none ${ORG_PILL[ticket.org] || "bg-slate-100 text-slate-600"}`}
        >
          {ticket.org}
        </span>
        {isHRTicket ? (
          <HRPill small />
        ) : cat ? (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border flex-none ${cat.pill}`}
          >
            <cat.Icon className="w-2.5 h-2.5" />
            {cat.label}
          </span>
        ) : null}
        {ticket.requestType && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-none ${ticket.requestType === "Incident" ? "bg-red-100 text-red-700 border border-red-200" : "bg-sky-100 text-sky-700 border border-sky-200"}`}
          >
            {ticket.requestType}
          </span>
        )}
        {ticket.priority && (
          <span
            className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-none ${PRIORITY_PILL[ticket.priority] || "bg-slate-100 text-slate-600"}`}
          >
            {ticket.priority}
          </span>
        )}
      </div>
      <p className="text-[13px] font-semibold text-slate-800 truncate mb-1">
        {ticket.description}
      </p>
      {(ticket.catalogParent || ticket.catalogCategory) && (
        <div className="flex items-center gap-1 mb-1 flex-wrap">
          {ticket.catalogParent && (
            <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-slate-100 text-slate-500 truncate max-w-[80px]">
              {ticket.catalogParent}
            </span>
          )}
          {ticket.catalogSubCategory && (
            <>
              <ChevronRight className="w-2 h-2 text-slate-300" />
              <span className="text-[9px] font-semibold px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 truncate max-w-[80px]">
                {ticket.catalogSubCategory}
              </span>
            </>
          )}
        </div>
      )}
      <div className="flex items-center gap-1.5 text-[10px]">
        <User className="w-2.5 h-2.5 text-slate-400 flex-none" />
        <span className="text-slate-500 truncate flex-1 min-w-0">
          {ticket.submittedBy}
        </span>
        <span
          className={`font-semibold px-1.5 py-0.5 rounded-full flex-none ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>
      {ticket.itAssignees?.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <UserCheck className="w-2.5 h-2.5" />
          <span className={isAssigned ? "text-blue-600 font-semibold" : ""}>
            {ticket.itAssignees.join(", ")}
          </span>
        </div>
      )}
      {ag && ag.length > 0 && ag.every((s) => !s.response_Received) && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 rounded-lg px-2 py-1 border border-orange-200">
          <Bell className="w-2.5 h-2.5" />
          {ag.length}/3 follow-ups · no response
        </div>
      )}
      {ticket.messages?.length > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
          <MessageSquareText className="w-2.5 h-2.5" />
          <span>
            {ticket.messages.length} msg
            {ticket.messages.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
      <div className="mt-1">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${(STATUS_META[ticket.status] || STATUS_META["Open"]).chip}`}
        >
          {ticket.status}
        </span>
      </div>
    </button>
  );
}

// ─── USER DASHBOARD ───────────────────────────────────────────────────────────
const USER_PAGE_SIZE = 5;
function UserDashboard({
  currentUser,
  tickets,
  ticketsLoading,
  onSelectTicket,
  selectedId,
  onCreateITTicket,
  onCreateHRTicket,
  onLogout,
}) {
  const [page, setPage] = useState(1);
  const myTickets = tickets.filter(
    (t) =>
      t.submittedByEmpId === String(currentUser.emp_Id) ||
      t.submittedBy === currentUser.emp_Name,
  );
  const stats = {
    total: myTickets.length,
    open: myTickets.filter((t) => t.status === "Open").length,
    inProgress: myTickets.filter((t) =>
      [
        "In Progress",
        "Requirement",
        "Discussion",
        "IT Testing",
        "Ready for Demo",
        "User Testing",
        "Queue",
        "Assigned",
      ].includes(t.status),
    ).length,
    waiting: myTickets.filter((t) => t.status === "Waiting for User Input")
      .length,
    closed: myTickets.filter((t) => t.status === "Closed").length,
  };
  const totalPages = Math.max(1, Math.ceil(myTickets.length / USER_PAGE_SIZE));
  const paginated = myTickets.slice(
    (page - 1) * USER_PAGE_SIZE,
    page * USER_PAGE_SIZE,
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="flex-none border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-none">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                Helpdesk · My Tickets
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Enlife System ·{" "}
                <span
                  className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${ORG_PILL[currentUser.org_Id] || ""}`}
                >
                  {currentUser.org_Id}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-emerald-200 bg-emerald-50">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black bg-emerald-500 text-white">
                {currentUser.emp_Name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {currentUser.emp_Name}
                </p>
                <p className="text-[10px] font-semibold text-emerald-600">
                  {currentUser.emp_No}
                </p>
              </div>
            </div>
            <button
              onClick={onCreateITTicket}
              className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              <Wrench className="h-3.5 w-3.5" />
              IT Ticket
            </button>
            <button
              onClick={onCreateHRTicket}
              className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Briefcase className="h-3.5 w-3.5" />
              HR Ticket
            </button>
            <button
              onClick={onLogout}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { l: "Total", v: stats.total, t: "slate" },
            { l: "Open", v: stats.open, t: "slate" },
            { l: "In Progress", v: stats.inProgress, t: "blue" },
            { l: "Waiting", v: stats.waiting, t: "orange" },
            { l: "Closed", v: stats.closed, t: "slate" },
          ].map((s) => (
            <div
              key={s.l}
              className={`rounded-2xl border px-4 py-3 ${s.t === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : s.t === "orange" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-white border-slate-200 text-slate-700"}`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {s.l}
              </p>
              <p className="text-2xl font-extrabold leading-none mt-1">{s.v}</p>
            </div>
          ))}
        </div>

        {ticketsLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mr-3" />
            Loading tickets…
          </div>
        ) : myTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 opacity-40" />
            </div>
            <p className="text-xl font-extrabold text-slate-700 mb-1">
              No tickets yet
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Raise a new ticket to get started.
            </p>
            <div className="flex gap-4">
              <button
                onClick={onCreateITTicket}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-slate-400 p-6 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-slate-800">
                    Raise IT Ticket
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hardware, software, network
                  </p>
                </div>
              </button>
              <button
                onClick={onCreateHRTicket}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 hover:border-indigo-400 p-6 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-extrabold text-indigo-800">
                    Raise HR Ticket
                  </p>
                  <p className="text-xs text-indigo-400 mt-0.5">
                    Payroll, attendance, HR
                  </p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((t) => {
                const isHR = t.ticketDept === "HR";
                const cat = !isHR ? getCatMeta(t.category) : null;
                const sm = STATUS_META[t.status] || STATUS_META["Open"];
                const badge = etaBadge(t.etaDate, t.status);
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTicket(t.id)}
                    className={`w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${selectedId === t.id ? "border-slate-800 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${ORG_PILL[t.org] || ""}`}
                          >
                            {t.org}
                          </span>
                          {isHR ? (
                            <HRPill />
                          ) : (
                            cat && (
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cat.pill}`}
                              >
                                {cat.label}
                              </span>
                            )
                          )}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${sm.chip}`}
                          >
                            {t.status}
                          </span>
                          {t.priority && (
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ml-auto ${PRIORITY_PILL[t.priority] || ""}`}
                            >
                              {t.priority}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-800 mb-1">
                          {t.description}
                        </p>
                        {(t.catalogParent || t.catalogCategory) && (
                          <div className="flex items-center gap-1 mb-1 flex-wrap">
                            {t.catalogParent && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                {t.catalogParent}
                              </span>
                            )}
                            {t.catalogSubCategory && (
                              <>
                                <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
                                  {t.catalogSubCategory}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {fmt(t.submittedDate)}
                          </span>
                          {t.itAssignees?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {t.itAssignees.join(", ")}
                            </span>
                          )}
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium">
                  Showing {(page - 1) * USER_PAGE_SIZE + 1}–
                  {Math.min(page * USER_PAGE_SIZE, myTickets.length)} of{" "}
                  {myTickets.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pg) => (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${pg === page ? "bg-slate-900 text-white border border-slate-900" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                      >
                        {pg}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── TICKET MODAL ─────────────────────────────────────────────────────────────
function TicketModal({
  ticket,
  currentUser,
  isIT,
  isHR,
  canAct,
  onClose,
  enrollForm,
  setEnrollForm,
  enrollErrors,
  onEnroll,
  enrollLoading,
  onMoveStatus,
  onPutOnHold,
  onWaitingForUserInput,
  onCloseTicket,
  strikeForm,
  setStrikeForm,
  strikeErrors,
  onSendStrike,
  responseForm,
  setResponseForm,
  onMarkResponse,
  onAutoClose,
  newMsg,
  setNewMsg,
  onSendMsg,
  msgLoading,
  onReassign,
  onEditType,
  onEditPriority,
  detailLoading,
  employees,
}) {
  const [tab, setTab] = useState("details");
  const isHRTicket = ticket.ticketDept === "HR";
  const cat =
    !isHRTicket && ticket.category ? getCatMeta(ticket.category) : null;
  const sm = STATUS_META[ticket.status] || STATUS_META["Open"];
  const badge = etaBadge(ticket.etaDate, ticket.status);
  const isClosed = ticket.status === "Closed";
  const isOnHold = ticket.status === "On Hold";
  const isWaiting = ticket.status === "Waiting for User Input";
  const isAssigned = ticket.status === "Assigned";
  const catFlow = isHRTicket ? HR_STATUSES : cat ? cat.statuses : [];
  const curIdx = catFlow.indexOf(ticket.status);
  const endRef = useRef(null);
  const isIncident = ticket.requestType === "Incident";
  const isFullFlowIT =
    !isHRTicket && FULL_FLOW_CATEGORIES.includes(ticket.category);
  const isReadOnly = (isIT || isHR) && !canAct && ticket.enrolledByIT;

  useEffect(() => {
    setTab("details");
  }, [ticket.id]);
  useEffect(() => {
    if (tab === "discussion")
      endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages, tab]);

  const nextStatuses =
    canAct && !isClosed && !isOnHold && !isWaiting
      ? catFlow.filter(
          (s, i) =>
            i > curIdx &&
            s !== "Closed" &&
            s !== "Waiting for User Input" &&
            s !== "On Hold",
        )
      : [];

  const allStrikes = ticket.strikes || [];
  const groups = getStrikeGroups(allStrikes);
  const activeGroup =
    groups.length > 0 &&
    !groups[groups.length - 1].every((s) => s.response_Received)
      ? groups[groups.length - 1]
      : [];
  const canSendNext = isWaiting && activeGroup.length < 3;
  const allActiveNoReply =
    activeGroup.length === 3 && activeGroup.every((s) => !s.response_Received);
  const prevGroups = groups.length > 1 ? groups.slice(0, -1) : [];
  const lastGroupAllDone =
    groups.length > 0 &&
    groups[groups.length - 1].every((s) => s.response_Received);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* Header */}
        <div className="flex-none border-b border-slate-100 px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ORG_PILL[ticket.org] || "bg-slate-100 text-slate-600"}`}
                >
                  {ticket.org}
                </span>
                {isHRTicket ? (
                  <HRPill />
                ) : (
                  cat && (
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cat.pill}`}
                    >
                      <cat.Icon className="w-3 h-3" />
                      {cat.label}
                    </span>
                  )
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${sm.chip}`}
                >
                  {ticket.status}
                </span>
                {ticket.requestType && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isIncident ? "bg-red-100 text-red-700 border-red-200" : "bg-sky-100 text-sky-700 border-sky-200"}`}
                  >
                    {ticket.requestType}
                  </span>
                )}
                {ticket.priority && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${PRIORITY_PILL[ticket.priority] || ""}`}
                  >
                    {ticket.priority}
                  </span>
                )}
                {ticket.ticketNo && (
                  <span className="text-[10px] font-bold mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-100">
                    {ticket.ticketNo}
                  </span>
                )}
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                    <EyeOff className="w-2.5 h-2.5" />
                    View Only
                  </span>
                )}
                {canAct && ticket.enrolledByIT && !isClosed && !isHRTicket && (
                  <>
                    <button
                      onClick={onEditType}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1"
                    >
                      <ArrowLeftRight className="w-2.5 h-2.5" />
                      Edit Type
                    </button>
                    <button
                      onClick={onEditPriority}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      Edit Priority
                    </button>
                  </>
                )}
                {canAct && ticket.enrolledByIT && !isClosed && isHRTicket && (
                  <button
                    onClick={onEditPriority}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                  >
                    <Tag className="w-2.5 h-2.5" />
                    Edit Priority
                  </button>
                )}
              </div>
              <p className="text-base font-bold text-slate-900 leading-snug">
                {ticket.description}
              </p>
              {(ticket.catalogParent ||
                ticket.catalogCategory ||
                ticket.catalogSubCategory) && (
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {ticket.catalogParent && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {ticket.catalogParent}
                    </span>
                  )}
                  {ticket.catalogCategory &&
                    ticket.catalogCategory !== ticket.catalogParent && (
                      <>
                        <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                          {ticket.catalogCategory}
                        </span>
                      </>
                    )}
                  {ticket.catalogSubCategory && (
                    <>
                      <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                        {ticket.catalogSubCategory}
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <User className="w-3 h-3" />
                  {ticket.submittedBy}
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-medium">
                  <CalendarDays className="w-3 h-3" />
                  Submitted {fmt(ticket.submittedDate)}
                </span>
                {ticket.itAssignees?.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1 text-xs font-medium">
                    <UserCheck className="w-3 h-3" />
                    {ticket.itAssignees.join(", ")}
                    {canAct && !isClosed && (
                      <button
                        onClick={onReassign}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                )}
                {ticket.attachment && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                    <Paperclip className="w-3 h-3" />
                    {ticket.attachment.name}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 flex-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Active
              </p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {daysBetween(ticket.submittedDate, todayISO())}d
              </p>
            </div>
            <div className={`rounded-xl border px-3 py-2 ${badge.cls}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                ETA
              </p>
              <p className="text-sm font-bold mt-0.5">{badge.label}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Msgs
              </p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {ticket.messages?.length || 0}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Strikes
              </p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {allStrikes.length}
              </p>
            </div>
          </div>

          {/* Status flow */}
          {catFlow.length > 0 && (
            <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
              {catFlow.map((s, i) => {
                const done = curIdx > i;
                const curr = ticket.status === s;
                const m = STATUS_META[s] || STATUS_META["Open"];
                return (
                  <div key={s} className="flex items-center gap-1 flex-none">
                    <div
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap ${curr ? m.chip + " border border-current/20" : done ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      {done && "✓ "}
                      {s}
                    </div>
                    {i < catFlow.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-slate-300 flex-none" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mt-3">
            {["details", "discussion", "history"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t}
                {t === "discussion" && ticket.messages?.length > 0
                  ? ` (${ticket.messages.length})`
                  : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scroll min-h-0">
          {detailLoading && (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading details…
            </div>
          )}
          {!detailLoading && tab === "details" && (
            <div className="p-6 space-y-4">
              {isReadOnly && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
                  <EyeOff className="w-5 h-5 text-slate-400 flex-none mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      View only — not assigned to you
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assigned to{" "}
                      <span className="font-semibold">
                        {ticket.itAssignees?.join(", ")}
                      </span>
                      .
                    </p>
                  </div>
                </div>
              )}

              <Section title="Ticket Information">
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <InfoBox
                    label="Submitted By"
                    value={`${ticket.submittedBy}${ticket.submittedByEmpId ? " #" + ticket.submittedByEmpId : ""}`}
                  />
                  <InfoBox
                    label="Department"
                    value={
                      ticket.ticketDept === "HR"
                        ? "HR Department"
                        : "IT Department"
                    }
                  />
                  <InfoBox
                    label="Submitted Date"
                    value={fmt(ticket.submittedDate)}
                  />
                  <InfoBox label="Organisation" value={ticket.org} />
                  <InfoBox
                    label="Request Type"
                    value={ticket.requestType || "—"}
                  />
                  {!isHRTicket && (
                    <InfoBox label="Category" value={cat?.label || "—"} />
                  )}
                  {ticket.attachment && (
                    <InfoBox
                      label="Attachment"
                      value={ticket.attachment.name}
                    />
                  )}
                  {ticket.catalogParent && (
                    <InfoBox
                      label="Catalog Parent"
                      value={ticket.catalogParent}
                    />
                  )}
                  {ticket.catalogCategory && (
                    <InfoBox
                      label="Catalog Category"
                      value={ticket.catalogCategory}
                    />
                  )}
                  {ticket.catalogSubCategory && (
                    <InfoBox
                      label="Catalog Item"
                      value={ticket.catalogSubCategory}
                    />
                  )}
                </div>
              </Section>

              {/* Enroll */}
              {(isIT || isHR) &&
                canAct &&
                !ticket.enrolledByIT &&
                ticket.status === "Open" && (
                  <Section
                    title="Enroll Ticket"
                    accent="amber"
                    subtitle={`Assign ${isHRTicket ? "HR" : "IT"} engineers, set priority and ETA.`}
                  >
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Priority" error={enrollErrors.priority}>
                          <div className="flex flex-wrap gap-2">
                            {PRIORITIES.map((p) => (
                              <button
                                key={p}
                                onClick={() =>
                                  setEnrollForm((f) => ({ ...f, priority: p }))
                                }
                                className={`h-8 px-3 rounded-lg border text-xs font-bold transition-all ${enrollForm.priority === p ? PRIORITY_PILL[p] + " shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </Field>
                        <Field
                          label="Request Type"
                          error={enrollErrors.ticketType}
                        >
                          <div className="flex gap-2">
                            {TICKET_TYPES.map((tt) => (
                              <button
                                key={tt}
                                onClick={() =>
                                  setEnrollForm((f) => ({
                                    ...f,
                                    ticketType: tt,
                                  }))
                                }
                                className={`flex-1 h-8 rounded-lg border text-xs font-bold transition-all ${enrollForm.ticketType === tt ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                              >
                                {tt}
                              </button>
                            ))}
                          </div>
                        </Field>
                      </div>

                      <AssigneeDropdown
                        value={enrollForm.assignees || []}
                        onChange={(v) =>
                          setEnrollForm((f) => ({ ...f, assignees: v }))
                        }
                        error={enrollErrors.assignees}
                        employees={employees}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <Field
                          label="Start Date"
                          error={enrollErrors.itStartDate}
                        >
                          <input
                            type="date"
                            value={enrollForm.itStartDate}
                            onChange={(e) =>
                              setEnrollForm((p) => ({
                                ...p,
                                itStartDate: e.target.value,
                              }))
                            }
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
                          />
                        </Field>
                        {enrollForm.ticketType === "Incident" ? (
                          <Field
                            label="Expected Hours"
                            error={enrollErrors.etaHours}
                          >
                            <input
                              type="number"
                              min="1"
                              value={enrollForm.etaHours}
                              onChange={(e) =>
                                setEnrollForm((p) => ({
                                  ...p,
                                  etaHours: e.target.value,
                                }))
                              }
                              placeholder="e.g. 4"
                              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-red-400"
                            />
                          </Field>
                        ) : (
                          <Field label="ETA Date" error={enrollErrors.etaDate}>
                            <input
                              type="date"
                              min={enrollForm.itStartDate}
                              value={enrollForm.etaDate}
                              onChange={(e) =>
                                setEnrollForm((p) => ({
                                  ...p,
                                  etaDate: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-slate-400"
                            />
                          </Field>
                        )}
                      </div>

                      <Field label="Remarks (optional)">
                        <textarea
                          rows={2}
                          value={enrollForm.itRemarks}
                          onChange={(e) =>
                            setEnrollForm((p) => ({
                              ...p,
                              itRemarks: e.target.value,
                            }))
                          }
                          placeholder="Scope, dependencies…"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400 resize-none"
                        />
                      </Field>

                      <button
                        onClick={onEnroll}
                        disabled={enrollLoading}
                        className={`w-full h-11 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${isHRTicket ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"}`}
                      >
                        {enrollLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        Enroll & Assign
                      </button>
                    </div>
                  </Section>
                )}

              {/* Enrollment details */}
              {ticket.enrolledByIT && (
                <Section title="Enrollment Details">
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <InfoBox label="Priority" value={ticket.priority || "—"} />
                    <InfoBox
                      label="Request Type"
                      value={ticket.requestType || "—"}
                    />
                    <InfoBox
                      label="Start Date"
                      value={fmt(ticket.itStartDate)}
                    />
                    <InfoBox
                      label={isIncident ? "ETA (Hours)" : "ETA Date"}
                      value={
                        isIncident
                          ? ticket.etaHours
                            ? `${ticket.etaHours} hrs`
                            : "—"
                          : fmt(ticket.etaDate)
                      }
                    />
                    <InfoBox
                      label="Closing Date"
                      value={fmt(ticket.closingDate)}
                    />
                  </div>
                  <div className="mt-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Assignees
                    </p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      {ticket.itAssignees?.join(", ") || "—"}
                    </p>
                  </div>
                  {ticket.itRemarks && (
                    <div className="mt-3 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-700 italic">
                      "{ticket.itRemarks}"
                    </div>
                  )}
                </Section>
              )}

              {/* Hold/Waiting info */}
              {(isOnHold || isWaiting) && (
                <div
                  className={`rounded-2xl border p-4 ${isWaiting ? "border-orange-200 bg-orange-50" : "border-amber-200 bg-amber-50"}`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ${isWaiting ? "text-orange-600" : "text-amber-600"}`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {isWaiting ? "Waiting for User Input" : "Hold Reason"}
                  </p>
                  {ticket.holdReasonType && (
                    <p className="text-sm font-bold text-slate-800 mb-1">
                      {
                        HOLD_REASON_OPTIONS.find(
                          (o) => o.value === ticket.holdReasonType,
                        )?.label
                      }
                    </p>
                  )}
                  {ticket.holdRemarks && (
                    <p className="text-sm text-slate-700">
                      {ticket.holdRemarks}
                    </p>
                  )}
                </div>
              )}

              {/* Start Work */}
              {canAct && ticket.enrolledByIT && isAssigned && !isClosed && (
                <Section
                  title="Start Work"
                  subtitle="Move to In Progress when you begin working."
                  accent="amber"
                >
                  <div className="mt-3">
                    <button
                      onClick={() => onMoveStatus("In Progress")}
                      className="w-full h-11 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Clock3 className="w-4 h-4" />
                      Move to In Progress
                    </button>
                  </div>
                </Section>
              )}

              {/* Three-strike */}
              {canAct && isWaiting && isFullFlowIT && (
                <Section
                  title="Three-Strike Follow-up"
                  accent="amber"
                  subtitle="Up to 3 follow-ups per round."
                >
                  <div className="mt-4 space-y-3">
                    {prevGroups.length > 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-2">
                          Completed Rounds
                        </p>
                        {prevGroups.map((g, gi) => (
                          <div
                            key={gi}
                            className="flex items-center justify-between py-1.5 border-b border-emerald-100 last:border-0"
                          >
                            <span className="text-xs font-bold text-emerald-700">
                              Round {gi + 1}
                            </span>
                            <span className="text-[10px] text-emerald-600 mono">
                              {fmt(g[0].sent_At?.slice(0, 10))} →{" "}
                              {fmt(
                                g
                                  .find((s) => s.response_Received)
                                  ?.response_At?.slice(0, 10),
                              )}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
                              All Responded
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {[1, 2, 3].map((num) => {
                      const strike = activeGroup.find(
                        (s) => s.strike_No === num,
                      );
                      const isNext = !strike && activeGroup.length === num - 1;
                      const locked = !strike && !isNext;
                      const isLastSentStrike =
                        activeGroup.length > 0 &&
                        activeGroup[activeGroup.length - 1]?.strike_Id ===
                          strike?.strike_Id;
                      return (
                        <div
                          key={num}
                          className={`rounded-xl border p-4 transition-all ${locked ? "bg-slate-50 border-slate-100 opacity-40" : strike?.response_Received ? "bg-emerald-50 border-emerald-200" : strike ? "bg-orange-50 border-orange-200" : "bg-white border-slate-200"}`}
                        >
                          <div className="flex items-center gap-2.5 mb-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-none ${strike?.response_Received ? "bg-emerald-500 text-white" : strike ? "bg-orange-500 text-white" : isNext ? "bg-slate-200 text-slate-600" : "bg-slate-200 text-slate-400"}`}
                            >
                              {num}
                            </div>
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-800">
                                Strike {num}
                              </span>
                              {strike && (
                                <span className="mono text-[11px] text-slate-500">
                                  Sent {fmt(strike.sent_At?.slice(0, 10))}
                                </span>
                              )}
                              {strike?.mail_Id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                                  <Mail className="w-2.5 h-2.5" />
                                  {strike.mail_Id}
                                </span>
                              )}
                              {strike?.response_Received && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✓ Response
                                </span>
                              )}
                              {strike &&
                                !strike.response_Received &&
                                !isLastSentStrike && (
                                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                    Window Closed
                                  </span>
                                )}
                              {strike &&
                                !strike.response_Received &&
                                isLastSentStrike && (
                                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                    No Reply
                                  </span>
                                )}
                            </div>
                          </div>
                          {strike && (
                            <div className="bg-white/80 rounded-lg border border-slate-100 px-3 py-2 text-xs text-slate-700 italic mb-2">
                              "{strike.strike_Note}"
                            </div>
                          )}
                          {strike?.response_Received && (
                            <div className="bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
                              <span className="font-bold">
                                Response (
                                {fmt(strike.response_At?.slice(0, 10))}):
                              </span>{" "}
                              {strike.response_Note}
                            </div>
                          )}
                          {strike &&
                            !strike.response_Received &&
                            isLastSentStrike && (
                              <div className="mt-2 space-y-2">
                                <input
                                  type="text"
                                  value={
                                    responseForm[strike.strike_Id]?.note || ""
                                  }
                                  onChange={(e) =>
                                    setResponseForm((p) => ({
                                      ...p,
                                      [strike.strike_Id]: {
                                        ...p[strike.strike_Id],
                                        note: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Enter user's response note…"
                                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:border-emerald-400"
                                />
                                {responseForm[strike.strike_Id]?.error && (
                                  <p className="text-[11px] text-red-600">
                                    {responseForm[strike.strike_Id].error}
                                  </p>
                                )}
                                <button
                                  onClick={() =>
                                    onMarkResponse(strike.strike_Id)
                                  }
                                  className="w-full h-9 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Mark Response Received
                                </button>
                              </div>
                            )}
                          {strike &&
                            !strike.response_Received &&
                            !isLastSentStrike && (
                              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs text-slate-400 italic">
                                Response window closed — Strike {num + 1} was
                                sent without receiving a reply.
                              </div>
                            )}
                          {isNext && canSendNext && (
                            <div className="space-y-2">
                              <Field
                                label="Recipient Mail ID"
                                error={strikeErrors.mailId}
                              >
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="email"
                                    value={strikeForm.mailId}
                                    onChange={(e) =>
                                      setStrikeForm((p) => ({
                                        ...p,
                                        mailId: e.target.value,
                                      }))
                                    }
                                    placeholder="user@company.com"
                                    className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-xs focus:outline-none focus:border-orange-400"
                                  />
                                </div>
                              </Field>
                              <Field
                                label="Follow-up Message"
                                error={strikeErrors.note}
                              >
                                <textarea
                                  rows={2}
                                  value={strikeForm.note}
                                  onChange={(e) =>
                                    setStrikeForm((p) => ({
                                      ...p,
                                      note: e.target.value,
                                    }))
                                  }
                                  placeholder={`Strike ${num} follow-up…`}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:border-orange-400 resize-none"
                                />
                              </Field>
                              <button
                                onClick={onSendStrike}
                                className="w-full h-9 rounded-lg bg-orange-500 text-xs font-bold text-white hover:bg-orange-600 flex items-center justify-center gap-1.5"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                Send Strike {num}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {allActiveNoReply && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <BellOff className="w-5 h-5 text-red-600 flex-none mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-red-800">
                              All 3 follow-ups unanswered
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                              You may now close this ticket.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={onAutoClose}
                          className="w-full h-10 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Close — No Response
                        </button>
                      </div>
                    )}
                    {lastGroupAllDone && activeGroup.length === 0 && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" />
                        All answered. Start a new round if needed.
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* Advance Stage */}
              {canAct &&
                ticket.enrolledByIT &&
                !isClosed &&
                !isOnHold &&
                !isWaiting &&
                !isAssigned &&
                nextStatuses.length > 0 && (
                  <Section title="Advance Stage" subtitle="Move forward.">
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nextStatuses.map((s) => {
                        const m = STATUS_META[s] || STATUS_META["Open"];
                        const SI = m.Icon;
                        return (
                          <button
                            key={s}
                            onClick={() => onMoveStatus(s)}
                            className={`flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-semibold transition-all hover:opacity-80 ${m.chip}`}
                          >
                            <SI className="w-4 h-4" />
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </Section>
                )}

              {/* Quick actions */}
              {canAct && ticket.enrolledByIT && !isClosed && !isAssigned && (
                <Section
                  title={isOnHold || isWaiting ? "Actions" : "Quick Actions"}
                >
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {!isOnHold && !isWaiting && isFullFlowIT && (
                      <>
                        <button
                          onClick={onPutOnHold}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 text-sm font-semibold hover:bg-amber-200"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Put On Hold
                        </button>
                        <button
                          onClick={onWaitingForUserInput}
                          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-orange-100 text-orange-800 border border-orange-200 text-sm font-semibold hover:bg-orange-200"
                        >
                          <Timer className="w-4 h-4" />
                          Waiting for User Input
                        </button>
                      </>
                    )}
                    {(isOnHold || isWaiting) && (
                      <button
                        onClick={() => onMoveStatus("In Progress")}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 text-sm font-semibold hover:bg-blue-200"
                      >
                        <Clock3 className="w-4 h-4" />
                        Resume to In Progress
                      </button>
                    )}
                    <button
                      onClick={onCloseTicket}
                      className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                    >
                      <XCircle className="w-4 h-4" />
                      Close Ticket
                    </button>
                    {ticket.itAssignees?.length > 0 && !isClosed && (
                      <button
                        onClick={onReassign}
                        className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold hover:bg-blue-100"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reassign
                      </button>
                    )}
                  </div>
                </Section>
              )}

              {/* Assigned quick actions */}
              {canAct && ticket.enrolledByIT && !isClosed && isAssigned && (
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={onCloseTicket}
                    className="flex items-center gap-2 h-9 px-4 rounded-xl bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900"
                  >
                    <XCircle className="w-4 h-4" />
                    Close Ticket
                  </button>
                  {ticket.itAssignees?.length > 0 && (
                    <button
                      onClick={onReassign}
                      className="flex items-center gap-2 h-9 px-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold hover:bg-blue-100"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reassign
                    </button>
                  )}
                </div>
              )}

              {/* Closed */}
              {isClosed && (
                <div
                  className={`rounded-2xl border p-4 ${ticket.autoClosedAfterStrikes ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
                >
                  <div className="flex items-start gap-3">
                    {ticket.autoClosedAfterStrikes ? (
                      <BellOff className="w-5 h-5 text-red-600 flex-none mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-none mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-bold ${ticket.autoClosedAfterStrikes ? "text-red-800" : "text-emerald-800"}`}
                      >
                        {ticket.autoClosedAfterStrikes
                          ? "Auto-Closed — 3 unanswered follow-ups"
                          : "Ticket Closed"}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${ticket.autoClosedAfterStrikes ? "text-red-600" : "text-emerald-600"}`}
                      >
                        Closed {fmt(ticket.closingDate)}
                      </p>
                      {ticket.closingNote && (
                        <div className="mt-2 rounded-xl bg-white/70 border border-current/10 px-3 py-2.5">
                          <p className="text-sm text-slate-700">
                            {ticket.closingNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!detailLoading && tab === "discussion" && (
            <div className="flex flex-col" style={{ minHeight: "400px" }}>
              <div
                className="flex-1 overflow-y-auto thin-scroll p-5 space-y-3"
                style={{ minHeight: "300px" }}
              >
                {(!ticket.messages || ticket.messages.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <MessageSquareText className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm font-medium">No messages yet.</p>
                  </div>
                )}
                {ticket.messages?.map((msg) => {
                  const senderName =
                    msg.message_By_Name || msg.senderName || "Unknown";
                  const isSelf =
                    msg.message_By === currentUser.emp_Id ||
                    msg.senderId === currentUser.emp_Id;
                  const isITMsg = msg.isIT;
                  const isHRMsg = msg.isHR;
                  const initials = senderName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div
                      key={msg.discussion_Id || msg.id}
                      className={`flex items-end gap-2 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex-none flex items-center justify-center text-[10px] font-black ${isITMsg ? "bg-blue-500 text-white" : isHRMsg ? "bg-indigo-500 text-white" : "bg-emerald-500 text-white"}`}
                      >
                        {initials}
                      </div>
                      <div
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-slate-500">
                            {senderName}
                          </span>
                          <span className="text-[10px] text-slate-400 mono">
                            {fmtTime(msg.message_At || msg.ts)}
                          </span>
                        </div>
                        <div
                          className={
                            isSelf
                              ? "cb-self"
                              : isITMsg
                                ? "cb-it"
                                : isHRMsg
                                  ? "cb-hr"
                                  : "cb-user"
                          }
                        >
                          {msg.message_Text || msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              {!isClosed ? (
                <div className="flex-none border-t border-slate-100 p-4">
                  <div className="flex gap-2">
                    <textarea
                      rows={2}
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSendMsg();
                        }
                      }}
                      placeholder="Type a message… (Enter to send)"
                      className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 resize-none"
                    />
                    <button
                      onClick={onSendMsg}
                      disabled={msgLoading}
                      className="w-10 h-10 self-end rounded-xl bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 flex-none disabled:opacity-60"
                    >
                      {msgLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sending as{" "}
                    <span className="font-bold">{currentUser.emp_Name}</span> ·{" "}
                    <span className="mono">#{currentUser.emp_No}</span>
                  </p>
                </div>
              ) : (
                <div className="flex-none border-t border-slate-100 p-4 text-center text-xs text-slate-400 font-medium">
                  Discussion closed — ticket is closed.
                </div>
              )}
            </div>
          )}

          {!detailLoading && tab === "history" && (
            <div className="p-5 space-y-2">
              {ticket.statusHistory.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-8">
                  No history available.
                </div>
              )}
              {[...ticket.statusHistory].reverse().map((e, i) => {
                const status = e.new_Value || e.status || "Open";
                const m = STATUS_META[status] || STATUS_META["Open"];
                const SI = m.Icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-none mt-0.5 ${m.chip}`}
                    >
                      <SI className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${m.txt}`}>
                          {status}
                        </span>
                        <span className="mono text-[11px] text-slate-400 flex-none">
                          {fmt(e.action_At?.slice?.(0, 10) || e.date)}
                        </span>
                      </div>
                      {(e.remarks || e.action_Type) && (
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {e.action_Type || ""}
                          {e.remarks ? " — " + e.remarks : ""}
                        </p>
                      )}
                      {e.action_By_Name && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          by {e.action_By_Name}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN HELPDESK PAGE ───────────────────────────────────────────────────────
export default function HelpdeskPage() {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 font-semibold">
            Session not found. Please log in first.
          </p>
        </div>
      </div>
    );
  }

  const currentUser = sessionUser;
  const role = deriveRole(currentUser.dept_Id);
  const isIT = role === "IT";
  const isHR = role === "HR";
  const isDeptUser = role === "User";

  // ── State ──
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [orgFilter, setOrgFilter] = useState(currentUser.org_Id || "IML");
  const [catalogRaw, setCatalogRaw] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [createITOpen, setCreateITOpen] = useState(false);
  const [createHROpen, setCreateHROpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Ticket detail sub-data
  const [ticketMessages, setTicketMessages] = useState({}); // { ticketId: [] }
  const [ticketStrikes, setTicketStrikes] = useState({}); // { ticketId: [] }
  const [ticketHistory, setTicketHistory] = useState({}); // { ticketId: [] }

  // Modal state
  const [enrollForm, setEnrollForm] = useState({
    assignees: [],
    itStartDate: todayISO(),
    etaDate: "",
    etaHours: "",
    itRemarks: "",
    priority: "Medium",
    ticketType: "Service Request",
  });
  const [enrollErrors, setEnrollErrors] = useState({});
  const [newMsg, setNewMsg] = useState("");
  const [holdModal, setHoldModal] = useState(false);
  const [holdNote, setHoldNote] = useState("");
  const [holdReasonType, setHoldReasonType] = useState("");
  const [holdError, setHoldError] = useState("");
  const [holdModalType, setHoldModalType] = useState("hold");
  const [closeModal, setCloseModal] = useState(false);
  const [closeNote, setCloseNote] = useState("");
  const [closeError, setCloseError] = useState("");
  const [strikeForm, setStrikeForm] = useState({ mailId: "", note: "" });
  const [strikeErrors, setStrikeErrors] = useState({});
  const [responseForm, setResponseForm] = useState({});
  const [stageRemarksModal, setStageRemarksModal] = useState({
    open: false,
    targetStatus: "",
    remarks: "",
  });
  const [reassignModal, setReassignModal] = useState(false);
  const [reassignees, setReassignees] = useState([]);
  const [editTypeModal, setEditTypeModal] = useState(false);
  const [editPriorityModal, setEditPriorityModal] = useState(false);

  const catalogTree = useMemo(() => parseCatalog(catalogRaw), [catalogRaw]);

  // ── Fetch tickets ──
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const payload = isIT
        ? { dept: "IT", empId: currentUser.emp_Id, org: orgFilter }
        : isHR
          ? { dept: "HR", empId: currentUser.emp_Id, org: orgFilter }
          : { empId: currentUser.emp_Id, org: orgFilter };
      const res = await ITHelpdeskService.getTickets(payload);
      const raw = res?.data || [];
      setTickets(raw.map(mapApiTicket));
    } catch (e) {
      console.error("Fetch tickets error:", e);
    } finally {
      setTicketsLoading(false);
    }
  }, [isIT, isHR, currentUser.emp_Id]);

  // ── Fetch catalog ──
  useEffect(() => {
    const cached = sessionStorage.getItem(CATALOG_CACHE_KEY);
    if (cached) {
      try {
        setCatalogRaw(JSON.parse(cached));
        return;
      } catch (e) {}
    }
    setCatalogLoading(true);
    HelpdeskService.GetHDCatalog()
      .then((res) => {
        const items = res?.data || [];
        setCatalogRaw(items);
        sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(items));
      })
      .catch((e) => console.error("Catalog fetch failed:", e))
      .finally(() => setCatalogLoading(false));
  }, []);

  // ── Fetch employees ──
  useEffect(() => {
    const dept = isIT ? "IT" : isHR ? "HR" : null;
    if (!dept) return;
    ITHelpdeskService.getTicketEmployees(dept)
      .then((res) => setEmployees(res?.data || []))
      .catch((e) => console.error("Employees fetch error:", e));
  }, [isIT, isHR]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // ── Fetch detail data when selecting a ticket ──
  useEffect(() => {
    if (!selectedId) return;
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const [histRes, msgRes, strikeRes] = await Promise.all([
          ITHelpdeskService.getHistoryById(selectedId).catch(() => null),
          ITHelpdeskService.getDiscussions(selectedId).catch(() => null),
          ITHelpdeskService.getStrikes(selectedId).catch(() => null),
        ]);
        setTicketHistory((prev) => ({
          ...prev,
          [selectedId]: histRes?.data || [],
        }));
        // Enrich messages with role info
        const msgs = (msgRes?.data || []).map((m) => {
          const empId = m.message_By;
          const emp = employees.find((e) => e.emp_Id === empId);
          return {
            ...m,
            isIT: emp?.dept_Id === 7,
            isHR: emp?.dept_Id === 5,
            senderId: empId,
          };
        });
        setTicketMessages((prev) => ({ ...prev, [selectedId]: msgs }));
        setTicketStrikes((prev) => ({
          ...prev,
          [selectedId]: strikeRes?.data || [],
        }));
      } catch (e) {
        console.error("Detail load error:", e);
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedId, employees]);

  // Reset enroll form on ticket change
  useEffect(() => {
    setEnrollForm({
      assignees: [],
      itStartDate: todayISO(),
      etaDate: "",
      etaHours: "",
      itRemarks: "",
      priority: "Medium",
      ticketType: "Service Request",
    });
    setEnrollErrors({});
    setHoldModal(false);
    setCloseModal(false);
    setStrikeForm({ mailId: "", note: "" });
    setStrikeErrors({});
    setResponseForm({});
    setStageRemarksModal({ open: false, targetStatus: "", remarks: "" });
    setReassignModal(false);
    setReassignees([]);
    setEditTypeModal(false);
    setEditPriorityModal(false);
  }, [selectedId]);

  // Build selected ticket with merged detail data
  const sel = useMemo(() => {
    if (!selectedId) return null;
    const base = tickets.find((t) => t.id === selectedId);
    if (!base) return null;
    return {
      ...base,
      messages: ticketMessages[selectedId] || [],
      strikes: ticketStrikes[selectedId] || [],
      statusHistory: ticketHistory[selectedId] || [],
    };
  }, [selectedId, tickets, ticketMessages, ticketStrikes, ticketHistory]);

  // ── canAct ──
  const canActOnTicket = useMemo(() => {
    if (!sel || isDeptUser) return false;
    const myName = currentUser.emp_Name;
    const myId = String(currentUser.emp_Id);
    const enrolled = sel.enrolledByIT;
    const isMyTicket =
      sel.itAssignees?.includes(myName) || sel.itAssigneeIds?.includes(myId);
    const isOpen = sel.status === "Open";
    if (isIT && sel.ticketDept === "IT") return isOpen || isMyTicket;
    if (isHR && sel.ticketDept === "HR") return isOpen || isMyTicket;
    return false;
  }, [sel, isIT, isHR, isDeptUser, currentUser]);

  // ── Patch ticket locally ──
  const patchLocal = useCallback((id, data) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t)),
    );
  }, []);

  // ── Create ticket ──
  const createTicket = async (fields) => {
    setSubmitting(true);
    try {
      const payload = {
        dept: fields.ticketDept,
        ticket_type: fields.type === "Linked Ticket" ? "linked" : "new",
        req_type: fields.requestType,
        category: fields.categoryStr,
        project: "",
        impact: fields.impact || "user",
        description: fields.description,
        org: currentUser.org_Id,
        submitted_by: currentUser.emp_Id,
        priority: "",
        parent_ticket_id: fields.parentId || "",
        file: fields.attachment || null,
      };
      await ITHelpdeskService.createITHelpdeskTicket(payload);
      await fetchTickets();
      setCreateITOpen(false);
      setCreateHROpen(false);
    } catch (e) {
      console.error("Create ticket error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Enroll ticket ──
  const enrollTicket = async () => {
    const errs = {};
    if (!enrollForm.assignees?.length)
      errs.assignees = "At least one assignee required.";
    if (!enrollForm.itStartDate) errs.itStartDate = "Start date required.";
    if (!enrollForm.priority) errs.priority = "Priority required.";
    if (!enrollForm.ticketType) errs.ticketType = "Ticket type required.";
    const isInc = enrollForm.ticketType === "Incident";
    if (isInc && !enrollForm.etaHours)
      errs.etaHours = "Expected hours required.";
    if (!isInc && !enrollForm.etaDate) errs.etaDate = "ETA required.";
    setEnrollErrors(errs);
    if (Object.keys(errs).length) return;

    setEnrollLoading(true);
    try {
      const assignedIds = enrollForm.assignees.map((e) => e.emp_Id).join(",");
      const payload = {
        ticket_Id: sel.id,
        priority: enrollForm.priority,
        req_Type: enrollForm.ticketType,
        assigned_Person: assignedIds,
        eta_Date: enrollForm.etaDate || null,
        eta_Time: enrollForm.etaHours || "",
        remarks: enrollForm.itRemarks.trim(),
        updated_By: currentUser.emp_Id,
      };
      await ITHelpdeskService.enrollTicket(payload);
      await fetchTickets();
      setSelectedId(null);
    } catch (e) {
      console.error("Enroll error:", e);
    } finally {
      setEnrollLoading(false);
    }
  };

  // ── Move status ──
  const moveStatus = async (ns, remarks = "") => {
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: ns,
        remarks: remarks,
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, { status: ns });
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Status update error:", e);
    }
  };

  // ── Hold ──
  const submitHold = async () => {
    if (!holdReasonType) {
      setHoldError("Please select a reason type.");
      return;
    }
    setHoldError("");
    const label =
      HOLD_REASON_OPTIONS.find((o) => o.value === holdReasonType)?.label || "";
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "On Hold",
        remarks: `${label}${holdNote.trim() ? ": " + holdNote.trim() : ""}`,
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "On Hold",
        holdRemarks: holdNote.trim(),
        holdReasonType,
      });
      setHoldModal(false);
      setHoldNote("");
      setHoldReasonType("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Hold error:", e);
    }
  };

  const submitWaiting = async () => {
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Waiting for User Input",
        remarks: holdNote.trim() || "",
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "Waiting for User Input",
        holdRemarks: holdNote.trim(),
      });
      setHoldModal(false);
      setHoldNote("");
      setHoldReasonType("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Waiting error:", e);
    }
  };

  // ── Close ──
  const submitClose = async () => {
    if (!closeNote.trim()) {
      setCloseError("Closing remarks are required.");
      return;
    }
    setCloseError("");
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Closed",
        remarks: closeNote.trim(),
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "Closed",
        closingDate: todayISO(),
        closingNote: closeNote.trim(),
      });
      setCloseModal(false);
      setCloseNote("");
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Close error:", e);
    }
  };

  // ── Send strike ──
  const sendStrike = async () => {
    const errs = {};
    if (!strikeForm.mailId.trim()) errs.mailId = "Mail ID required.";
    if (!strikeForm.note.trim()) errs.note = "Follow-up message required.";
    setStrikeErrors(errs);
    if (Object.keys(errs).length) return;
    const strikes = ticketStrikes[sel.id] || [];
    const groups = getStrikeGroups(strikes);
    const activeGroup =
      groups.length > 0 &&
      !groups[groups.length - 1].every((s) => s.response_Received)
        ? groups[groups.length - 1]
        : [];
    const strikeNo = activeGroup.length + 1;
    try {
      await ITHelpdeskService.sendStrike({
        ticket_Id: sel.id,
        strike_No: strikeNo,
        mail_Id: strikeForm.mailId.trim(),
        strike_Note: strikeForm.note.trim(),
        sent_By: currentUser.emp_Id,
      });
      // Refresh strikes
      const res = await ITHelpdeskService.getStrikes(sel.id);
      setTicketStrikes((prev) => ({ ...prev, [sel.id]: res?.data || [] }));
      setStrikeForm({ mailId: "", note: "" });
    } catch (e) {
      console.error("Strike error:", e);
    }
  };

  // ── Mark response ──
  const markResponse = async (strikeId) => {
    const note = (responseForm[strikeId]?.note || "").trim();
    if (!note) {
      setResponseForm((p) => ({
        ...p,
        [strikeId]: { ...p[strikeId], error: "Response note required." },
      }));
      return;
    }
    setResponseForm((p) => ({ ...p, [strikeId]: { note: "", error: "" } }));
    try {
      await ITHelpdeskService.respondStrike({
        strike_Id: strikeId,
        response_Note: note,
      });
      const res = await ITHelpdeskService.getStrikes(sel.id);
      setTicketStrikes((prev) => ({ ...prev, [sel.id]: res?.data || [] }));
    } catch (e) {
      console.error("Respond strike error:", e);
    }
  };

  // ── Auto close ──
  const autoClose = async () => {
    try {
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: "Closed",
        remarks: "Auto-closed after 3 unanswered follow-ups.",
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, {
        status: "Closed",
        closingDate: todayISO(),
        autoClosedAfterStrikes: true,
        closingNote: "Auto-closed after 3 unanswered follow-ups.",
      });
      setSelectedId(null);
      await fetchTickets();
    } catch (e) {
      console.error("Auto close error:", e);
    }
  };

  // ── Send message ──
  const sendMessage = async () => {
    if (!newMsg.trim()) return;
    setMsgLoading(true);
    try {
      await ITHelpdeskService.addDiscussion({
        ticket_Id: sel.id,
        message_Text: newMsg.trim(),
        message_By: currentUser.emp_Id,
      });
      const res = await ITHelpdeskService.getDiscussions(sel.id);
      const msgs = (res?.data || []).map((m) => ({
        ...m,
        isIT: m.message_By === currentUser.emp_Id && isIT,
        isHR: m.message_By === currentUser.emp_Id && isHR,
        senderId: m.message_By,
      }));
      setTicketMessages((prev) => ({ ...prev, [sel.id]: msgs }));
      setNewMsg("");
    } catch (e) {
      console.error("Message error:", e);
    } finally {
      setMsgLoading(false);
    }
  };

  // ── Stage confirm ──
  const confirmStageMove = async () => {
    if (!stageRemarksModal.targetStatus) return;
    await moveStatus(stageRemarksModal.targetStatus, stageRemarksModal.remarks);
    setStageRemarksModal({ open: false, targetStatus: "", remarks: "" });
  };

  // ── Reassign ──
  const submitReassign = async () => {
    if (!reassignees.length) return;
    try {
      await ITHelpdeskService.reassignTicket({
        ticket_Id: sel.id,
        assigned_Person: reassignees.map((e) => e.emp_Id).join(","),
        updated_By: currentUser.emp_Id,
        remarks: "",
      });
      patchLocal(sel.id, {
        itAssignees: reassignees.map((e) => e.emp_Name),
        itAssigneeIds: reassignees.map((e) => String(e.emp_Id)),
      });
      setReassignModal(false);
      await fetchTickets();
    } catch (e) {
      console.error("Reassign error:", e);
    }
  };

  // ── Edit type ──
  const submitEditType = async (nt) => {
    try {
      await ITHelpdeskService.updateHistory({
        ticket_Id: sel.id,
        action_Type: "TYPE_CHANGED",
        old_Value: sel.requestType || "",
        new_Value: nt,
        remarks: "",
        action_By: currentUser.emp_Id,
      });
      await ITHelpdeskService.updateTicketStatus({
        ticket_Id: sel.id,
        status: sel.status,
        remarks: `Type → ${nt}`,
        updated_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, { ticketType: nt, requestType: nt });
      setEditTypeModal(false);
    } catch (e) {
      console.error("Edit type error:", e);
    }
  };

  // ── Edit priority ──
  const submitEditPriority = async (np) => {
    try {
      await ITHelpdeskService.updateHistory({
        ticket_Id: sel.id,
        action_Type: "PRIORITY_CHANGED",
        old_Value: sel.priority || "",
        new_Value: np,
        remarks: "",
        action_By: currentUser.emp_Id,
      });
      patchLocal(sel.id, { priority: np });
      setEditPriorityModal(false);
    } catch (e) {
      console.error("Edit priority error:", e);
    }
  };

  // ── Logout ──
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    window.location.href = "/";
  };

  // ── Kanban columns ──
  const visibleTickets = useMemo(() => {
    let base = tickets;
    if (isIT) base = base.filter((t) => t.ticketDept === "IT");
    if (isHR) base = base.filter((t) => t.ticketDept === "HR");
    if ((isIT || isHR) && orgFilter)
      base = base.filter((t) => t.org === orgFilter);
    return base;
  }, [tickets, isIT, isHR, orgFilter]);

  const stats = useMemo(() => {
    const base = visibleTickets;
    const overdue = base.filter(
      (t) =>
        t.etaDate &&
        t.status !== "Closed" &&
        daysBetween(todayISO(), t.etaDate) < 0,
    ).length;
    return {
      total: base.length,
      open: base.filter((t) => t.status === "Open").length,
      inProgress: base.filter((t) => t.status === "In Progress").length,
      onHold: base.filter((t) => t.status === "On Hold").length,
      waiting: base.filter((t) => t.status === "Waiting for User Input").length,
      closed: base.filter((t) => t.status === "Closed").length,
      overdue,
    };
  }, [visibleTickets]);

  const buildITColumns = () => {
    const myName = currentUser.emp_Name;
    const openUnassigned = visibleTickets.filter(
      (t) => !t.enrolledByIT && t.status === "Open",
    );
    const combinedQueue = visibleTickets.filter(
      (t) =>
        t.enrolledByIT &&
        t.status !== "Closed" &&
        !TESTING_STATUSES.includes(t.status) &&
        t.status !== "On Hold" &&
        t.status !== "Waiting for User Input" &&
        t.status !== "In Progress" &&
        t.status !== "Assigned" &&
        !t.itAssignees?.includes(myName),
    );
    const assignedToMe = visibleTickets.filter(
      (t) =>
        t.enrolledByIT &&
        t.status === "Assigned" &&
        t.itAssignees?.includes(myName),
    );
    const inProgressMine = visibleTickets.filter(
      (t) =>
        t.enrolledByIT &&
        t.status === "In Progress" &&
        t.itAssignees?.includes(myName),
    );
    const testingCol = visibleTickets.filter(
      (t) => t.enrolledByIT && TESTING_STATUSES.includes(t.status),
    );
    const waitingCol = visibleTickets.filter(
      (t) =>
        t.status === "Waiting for User Input" &&
        FULL_FLOW_CATEGORIES.includes(t.category),
    );
    const onHoldCol = visibleTickets.filter(
      (t) =>
        t.status === "On Hold" && FULL_FLOW_CATEGORIES.includes(t.category),
    );
    const closedCol = visibleTickets.filter((t) => t.status === "Closed");
    return [
      {
        key: "open",
        label: "Open",
        meta: STATUS_META["Open"],
        items: openUnassigned,
        subtitle: "Awaiting assignment",
        accent: "emerald",
      },
      {
        key: "queue",
        label: "Queue",
        meta: {
          dot: "bg-slate-400",
          txt: "text-slate-600",
          chip: "bg-slate-100 text-slate-600",
          Icon: List,
        },
        items: combinedQueue,
        subtitle: "All assigned tickets",
        accent: "slate",
      },
      {
        key: "assigned_me",
        label: "Assigned to Me",
        meta: STATUS_META["Assigned"],
        items: assignedToMe,
        subtitle: "Enrolled & assigned to you",
        accent: "purple",
      },
      {
        key: "in_progress_me",
        label: "In Progress",
        meta: STATUS_META["In Progress"],
        items: inProgressMine,
        subtitle: "My active work",
        accent: "blue",
      },
      {
        key: "testing",
        label: "Testing",
        meta: {
          dot: "bg-indigo-500",
          txt: "text-indigo-700",
          chip: "bg-indigo-100 text-indigo-700",
          Icon: FlaskConical,
        },
        items: testingCol,
        subtitle: "IT / User testing",
        accent: "indigo",
      },
      ...(waitingCol.length > 0
        ? [
            {
              key: "waiting",
              label: "Waiting for User Input",
              meta: STATUS_META["Waiting for User Input"],
              items: waitingCol,
              subtitle: "Awaiting user response",
              accent: "orange",
            },
          ]
        : []),
      ...(onHoldCol.length > 0
        ? [
            {
              key: "on_hold",
              label: "On Hold",
              meta: STATUS_META["On Hold"],
              items: onHoldCol,
              subtitle: "Blocked / paused",
              accent: "amber",
            },
          ]
        : []),
      {
        key: "closed",
        label: "Closed",
        meta: STATUS_META["Closed"],
        items: closedCol,
        subtitle: null,
        accent: "slate",
      },
    ];
  };

  const buildHRColumns = () => {
    const myName = currentUser.emp_Name;
    return [
      {
        key: "hr_open",
        label: "Open",
        meta: STATUS_META["Open"],
        items: visibleTickets.filter(
          (t) => !t.enrolledByIT && t.status === "Open",
        ),
        subtitle: "Awaiting HR",
        accent: "slate",
      },
      {
        key: "hr_queue",
        label: "Queue",
        meta: STATUS_META["Queue"],
        items: visibleTickets.filter(
          (t) => t.enrolledByIT && t.status === "Queue",
        ),
        subtitle: "In HR queue",
        accent: "slate",
      },
      {
        key: "hr_assigned_me",
        label: "Assigned to Me",
        meta: STATUS_META["Assigned"],
        items: visibleTickets.filter(
          (t) =>
            t.enrolledByIT &&
            t.status === "Assigned" &&
            t.itAssignees?.includes(myName),
        ),
        subtitle: "Assigned to you",
        accent: "purple",
      },
      {
        key: "hr_inprogress",
        label: "In Progress",
        meta: STATUS_META["In Progress"],
        items: visibleTickets.filter(
          (t) =>
            t.enrolledByIT &&
            t.status === "In Progress" &&
            t.itAssignees?.includes(myName),
        ),
        subtitle: "My active work",
        accent: "indigo",
      },
      {
        key: "hr_closed",
        label: "Closed",
        meta: STATUS_META["Closed"],
        items: visibleTickets.filter((t) => t.status === "Closed"),
        subtitle: null,
        accent: "slate",
      },
    ];
  };

  const allKanbanCols = isHR ? buildHRColumns() : buildITColumns();

  const ACCENT_COL = {
    emerald: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/20",
      hdr: "border-emerald-100",
      sub: "text-emerald-600",
      inner: "bg-emerald-50/10",
    },
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50/30",
      hdr: "border-blue-100",
      sub: "text-blue-500",
      inner: "bg-blue-50/20",
    },
    indigo: {
      border: "border-indigo-200",
      bg: "bg-indigo-50/30",
      hdr: "border-indigo-100",
      sub: "text-indigo-500",
      inner: "bg-indigo-50/20",
    },
    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50/30",
      hdr: "border-purple-100",
      sub: "text-purple-500",
      inner: "bg-purple-50/20",
    },
    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50/30",
      hdr: "border-orange-100",
      sub: "text-orange-500",
      inner: "bg-orange-50/20",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-amber-50/30",
      hdr: "border-amber-100",
      sub: "text-amber-500",
      inner: "bg-amber-50/20",
    },
    slate: {
      border: "border-slate-200",
      bg: "bg-white",
      hdr: "border-slate-100",
      sub: "text-slate-400",
      inner: "bg-slate-50/50",
    },
  };

  // ── Global styles ──
  const globalStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;margin:0;}
    .mono{font-family:'JetBrains Mono',monospace;}
    .thin-scroll::-webkit-scrollbar{width:4px;}
    .thin-scroll::-webkit-scrollbar-track{background:transparent;}
    .thin-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;}
    .modal-overlay{position:fixed;inset:0;z-index:50;background:rgba(15,23,42,0.65);display:flex;align-items:center;justify-content:center;padding:1rem;}
    .modal-box{background:#fff;border-radius:1.25rem;border:1px solid #e2e8f0;box-shadow:0 25px 60px rgba(0,0,0,0.2);width:100%;max-width:940px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;}
    .mini-modal{background:#fff;border-radius:1rem;border:1px solid #e2e8f0;box-shadow:0 20px 50px rgba(0,0,0,0.25);width:100%;max-width:440px;}
    .cb-it{background:#1e293b;color:#f8fafc;border-radius:1rem 1rem 0.25rem 1rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    .cb-hr{background:#4338ca;color:#fff;border-radius:1rem 1rem 0.25rem 1rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    .cb-user{background:#f1f5f9;color:#1e293b;border-radius:1rem 1rem 1rem 0.25rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
    .cb-self{background:#3b82f6;color:#fff;border-radius:1rem 1rem 0.25rem 1rem;padding:.5rem .875rem;max-width:78%;font-size:.8125rem;line-height:1.5;}
  `;

  // ── User (non-IT/HR) view ──
  if (isDeptUser) {
    return (
      <>
        <style>{globalStyles}</style>
        <UserDashboard
          currentUser={currentUser}
          tickets={tickets}
          ticketsLoading={ticketsLoading}
          onSelectTicket={setSelectedId}
          selectedId={selectedId}
          onCreateITTicket={() => setCreateITOpen(true)}
          onCreateHRTicket={() => setCreateHROpen(true)}
          onLogout={handleLogout}
        />
        {sel && (
          <TicketModal
            ticket={sel}
            currentUser={currentUser}
            isIT={false}
            isHR={false}
            canAct={false}
            onClose={() => setSelectedId(null)}
            enrollForm={enrollForm}
            setEnrollForm={setEnrollForm}
            enrollErrors={enrollErrors}
            onEnroll={enrollTicket}
            enrollLoading={enrollLoading}
            onMoveStatus={(ns) =>
              setStageRemarksModal({
                open: true,
                targetStatus: ns,
                remarks: "",
              })
            }
            onPutOnHold={() => {
              setHoldNote("");
              setHoldReasonType("");
              setHoldError("");
              setHoldModalType("hold");
              setHoldModal(true);
            }}
            onWaitingForUserInput={() => {
              setHoldNote("");
              setHoldReasonType("");
              setHoldError("");
              setHoldModalType("waiting");
              setHoldModal(true);
            }}
            onCloseTicket={() => {
              setCloseNote("");
              setCloseError("");
              setCloseModal(true);
            }}
            strikeForm={strikeForm}
            setStrikeForm={setStrikeForm}
            strikeErrors={strikeErrors}
            onSendStrike={sendStrike}
            responseForm={responseForm}
            setResponseForm={setResponseForm}
            onMarkResponse={markResponse}
            onAutoClose={autoClose}
            newMsg={newMsg}
            setNewMsg={setNewMsg}
            onSendMsg={sendMessage}
            msgLoading={msgLoading}
            onReassign={() => {
              setReassignees([]);
              setReassignModal(true);
            }}
            onEditType={() => setEditTypeModal(true)}
            onEditPriority={() => setEditPriorityModal(true)}
            detailLoading={detailLoading}
            employees={employees}
          />
        )}
        {createITOpen && (
          <CreateITModal
            catalogTree={catalogTree}
            catalogLoading={catalogLoading}
            currentUser={currentUser}
            onClose={() => setCreateITOpen(false)}
            onSubmit={createTicket}
            submitting={submitting}
          />
        )}
        {createHROpen && (
          <CreateHRModal
            catalogTree={catalogTree}
            catalogLoading={catalogLoading}
            currentUser={currentUser}
            onClose={() => setCreateHROpen(false)}
            onSubmit={createTicket}
            submitting={submitting}
          />
        )}
      </>
    );
  }

  // ── IT / HR Kanban view ──
  return (
    <>
      <style>{globalStyles}</style>
      <div className="h-screen overflow-hidden bg-slate-100 text-slate-900 flex flex-col">
        {/* Header */}
        <header className="flex-none border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto max-w-[1900px] px-5 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-none">
                  {isHR ? (
                    <Briefcase className="w-4 h-4 text-white" />
                  ) : (
                    <Wrench className="w-4 h-4 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight">
                    {isHR ? "HR" : "IT"} Helpdesk · Enlife System
                  </h1>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Category-driven ticket management
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${isHR ? "border-indigo-200 bg-indigo-50" : "border-blue-200 bg-blue-50"}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isHR ? "bg-indigo-500" : "bg-blue-500"} text-white`}
                  >
                    {currentUser.emp_Name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-none">
                      {currentUser.emp_Name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      #{currentUser.emp_No}
                    </p>
                  </div>
                </div>
                {isIT && (
                  <button
                    onClick={() => setCreateITOpen(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    IT Ticket
                  </button>
                )}
                {isHR && (
                  <button
                    onClick={() => setCreateHROpen(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    HR Ticket
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Org filter + stats */}
            <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Org:
                </span>
                {["IML", "CSIL", "Daedalus"].map((org) => (
                  <button
                    key={org}
                    onClick={() => setOrgFilter(org)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${orgFilter === org ? ORG_PILL[org] + " shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                  >
                    {org}
                  </button>
                ))}
                <button
                  onClick={fetchTickets}
                  className="ml-2 w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${ticketsLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { l: "Total", v: stats.total, t: "slate" },
                  { l: "Open", v: stats.open, t: "slate" },
                  { l: "Progress", v: stats.inProgress, t: "blue" },
                  ...(isIT
                    ? [
                        { l: "On Hold", v: stats.onHold, t: "amber" },
                        { l: "Waiting", v: stats.waiting, t: "orange" },
                      ]
                    : []),
                  { l: "Closed", v: stats.closed, t: "slate" },
                  { l: "Overdue", v: stats.overdue, t: "red" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className={`rounded-xl border px-3 py-2 ${s.t === "red" ? "bg-red-50 border-red-200 text-red-700" : s.t === "blue" ? "bg-blue-50 border-blue-200 text-blue-700" : s.t === "amber" ? "bg-amber-50 border-amber-200 text-amber-700" : s.t === "orange" ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-slate-50 border-slate-200 text-slate-700"}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {s.l}
                    </p>
                    <p className="text-xl font-extrabold leading-none mt-0.5">
                      {s.v}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Kanban board */}
        <main className="flex-1 overflow-x-auto overflow-y-hidden p-4 min-h-0">
          {ticketsLoading && !tickets.length ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mr-3" />
              Loading tickets…
            </div>
          ) : (
            <div
              className="flex gap-3 h-full"
              style={{ minWidth: `${allKanbanCols.length * 215}px` }}
            >
              {allKanbanCols.map((col) => {
                const Icon = col.meta.Icon;
                const ac = ACCENT_COL[col.accent] || ACCENT_COL.slate;
                return (
                  <div
                    key={col.key}
                    className={`flex flex-col rounded-2xl border shadow-sm min-h-0 ${ac.border} ${ac.bg}`}
                    style={{ minWidth: "200px", flex: "1" }}
                  >
                    <div
                      className={`flex flex-col border-b px-3 py-2.5 flex-none ${ac.hdr}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${col.meta.dot}`}
                          />
                          <Icon className={`w-3.5 h-3.5 ${col.meta.txt}`} />
                          <span className={`text-xs font-bold ${col.meta.txt}`}>
                            {col.label}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.meta.chip}`}
                        >
                          {col.items.length}
                        </span>
                      </div>
                      {col.subtitle && (
                        <p
                          className={`text-[10px] mt-0.5 ml-[18px] ${ac.sub} font-medium`}
                        >
                          {col.subtitle}
                        </p>
                      )}
                    </div>
                    <div
                      className={`flex-1 overflow-y-auto thin-scroll p-2 space-y-2 min-h-0 ${ac.inner}`}
                    >
                      {col.items.length === 0 ? (
                        <div className="flex items-center justify-center h-14 rounded-xl border border-dashed border-slate-200 bg-white text-[11px] text-slate-400">
                          No tickets
                        </div>
                      ) : (
                        col.items.map((t) => (
                          <TicketCard
                            key={t.id}
                            ticket={t}
                            active={t.id === selectedId}
                            onClick={() => setSelectedId(t.id)}
                            currentUser={currentUser}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Ticket Modal */}
      {sel && (
        <TicketModal
          ticket={sel}
          currentUser={currentUser}
          isIT={isIT}
          isHR={isHR}
          canAct={canActOnTicket}
          onClose={() => setSelectedId(null)}
          enrollForm={enrollForm}
          setEnrollForm={setEnrollForm}
          enrollErrors={enrollErrors}
          onEnroll={enrollTicket}
          enrollLoading={enrollLoading}
          onMoveStatus={(ns) =>
            setStageRemarksModal({ open: true, targetStatus: ns, remarks: "" })
          }
          onPutOnHold={() => {
            setHoldNote("");
            setHoldReasonType("");
            setHoldError("");
            setHoldModalType("hold");
            setHoldModal(true);
          }}
          onWaitingForUserInput={() => {
            setHoldNote("");
            setHoldReasonType("");
            setHoldError("");
            setHoldModalType("waiting");
            setHoldModal(true);
          }}
          onCloseTicket={() => {
            setCloseNote("");
            setCloseError("");
            setCloseModal(true);
          }}
          strikeForm={strikeForm}
          setStrikeForm={setStrikeForm}
          strikeErrors={strikeErrors}
          onSendStrike={sendStrike}
          responseForm={responseForm}
          setResponseForm={setResponseForm}
          onMarkResponse={markResponse}
          onAutoClose={autoClose}
          newMsg={newMsg}
          setNewMsg={setNewMsg}
          onSendMsg={sendMessage}
          msgLoading={msgLoading}
          onReassign={() => {
            setReassignees(
              employees.filter((e) =>
                sel.itAssigneeIds?.includes(String(e.emp_Id)),
              ),
            );
            setReassignModal(true);
          }}
          onEditType={() => setEditTypeModal(true)}
          onEditPriority={() => setEditPriorityModal(true)}
          detailLoading={detailLoading}
          employees={employees}
        />
      )}

      {/* Stage remarks modal */}
      {stageRemarksModal.open && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget &&
            setStageRemarksModal({ open: false, targetStatus: "", remarks: "" })
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Move to: {stageRemarksModal.targetStatus}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add remarks (optional).
                </p>
              </div>
              <button
                onClick={() =>
                  setStageRemarksModal({
                    open: false,
                    targetStatus: "",
                    remarks: "",
                  })
                }
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Field label="Remarks (optional)">
              <textarea
                rows={3}
                value={stageRemarksModal.remarks}
                onChange={(e) =>
                  setStageRemarksModal((p) => ({
                    ...p,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Notes…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
            </Field>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() =>
                  setStageRemarksModal({
                    open: false,
                    targetStatus: "",
                    remarks: "",
                  })
                }
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmStageMove}
                className="flex-1 h-10 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold / Waiting modal */}
      {holdModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setHoldModal(false)}
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {holdModalType === "waiting"
                    ? "Set: Waiting for User Input"
                    : "Put On Hold"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {holdModalType === "waiting"
                    ? "Optionally add a note."
                    : "Document reason."}
                </p>
              </div>
              <button
                onClick={() => setHoldModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {holdModalType === "hold" && (
              <Field label="Reason Type" error={holdError}>
                <div className="relative">
                  <select
                    value={holdReasonType}
                    onChange={(e) => setHoldReasonType(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-amber-400"
                  >
                    <option value="">Select reason…</option>
                    {HOLD_REASON_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </Field>
            )}
            <div className={holdModalType === "hold" ? "mt-3" : ""}>
              <Field label="Remarks (optional)">
                <textarea
                  rows={3}
                  value={holdNote}
                  onChange={(e) => setHoldNote(e.target.value)}
                  placeholder={
                    holdModalType === "waiting"
                      ? "What are you waiting on? (optional)"
                      : "Optional context…"
                  }
                  className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm focus:outline-none resize-none ${holdModalType === "waiting" ? "border-orange-300 focus:border-orange-400" : "border-slate-300 focus:border-amber-400"}`}
                />
              </Field>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setHoldModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={
                  holdModalType === "waiting" ? submitWaiting : submitHold
                }
                className={`flex-1 h-10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 ${holdModalType === "waiting" ? "bg-orange-500 hover:bg-orange-600" : "bg-amber-500 hover:bg-amber-600"}`}
              >
                {holdModalType === "waiting" ? (
                  <>
                    <Timer className="w-4 h-4" />
                    Set Waiting
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Put On Hold
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close modal */}
      {closeModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setCloseModal(false)}
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Close Ticket
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add closing remarks.
                </p>
              </div>
              <button
                onClick={() => setCloseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <Field label="Closing Remarks" error={closeError}>
              <textarea
                rows={4}
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Outcome, what was done…"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-400 resize-none"
              />
            </Field>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setCloseModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitClose}
                className="flex-1 h-10 rounded-xl bg-slate-800 text-sm font-bold text-white hover:bg-slate-900 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Confirm Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign modal */}
      {reassignModal && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setReassignModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Reassign
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select engineers.
                </p>
              </div>
              <button
                onClick={() => setReassignModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <AssigneeDropdown
              value={reassignees}
              onChange={setReassignees}
              employees={employees}
              label="Select Engineers"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReassignModal(false)}
                className="flex-1 h-10 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submitReassign}
                disabled={!reassignees.length}
                className="flex-1 h-10 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Reassign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Type modal */}
      {editTypeModal && sel && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setEditTypeModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">
                Change Request Type
              </h2>
              <button
                onClick={() => setEditTypeModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TICKET_TYPES.map((tt) => (
                <button
                  key={tt}
                  onClick={() => submitEditType(tt)}
                  className={`h-12 rounded-xl border text-sm font-bold transition-all ${sel.requestType === tt ? "bg-slate-900 text-white border-slate-900" : tt === "Incident" ? "border-red-200 text-red-700 hover:bg-red-50" : "border-sky-200 text-sky-700 hover:bg-sky-50"}`}
                >
                  {tt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Priority modal */}
      {editPriorityModal && sel && (
        <div
          className="modal-overlay"
          onClick={(e) =>
            e.target === e.currentTarget && setEditPriorityModal(false)
          }
        >
          <div className="mini-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-extrabold text-slate-900">
                Change Priority
              </h2>
              <button
                onClick={() => setEditPriorityModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => submitEditPriority(p)}
                  className={`w-full h-10 rounded-xl border text-sm font-bold transition-all ${sel.priority === p ? PRIORITY_PILL[p] + " shadow-sm" : (PRIORITY_PILL[p] || "") + " opacity-60 hover:opacity-100"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create IT/HR modals */}
      {createITOpen && (
        <CreateITModal
          catalogTree={catalogTree}
          catalogLoading={catalogLoading}
          currentUser={currentUser}
          onClose={() => setCreateITOpen(false)}
          onSubmit={createTicket}
          submitting={submitting}
        />
      )}
      {createHROpen && (
        <CreateHRModal
          catalogTree={catalogTree}
          catalogLoading={catalogLoading}
          currentUser={currentUser}
          onClose={() => setCreateHROpen(false)}
          onSubmit={createTicket}
          submitting={submitting}
        />
      )}
    </>
  );
}
