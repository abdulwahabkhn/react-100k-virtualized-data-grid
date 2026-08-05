import type {
  ColumnDefinition,
  EmployeeRow,
} from "@/features/grid/model/grid.types";

export const employeeColumns = [
  {
    id: "employeeId",
    header: "Employee ID",
    width: 130,
    accessor: (row) => row.employeeId,
  },
  {
    id: "name",
    header: "Employee",
    width: 180,
    accessor: (row) => row.name,
  },
  {
    id: "department",
    header: "Department",
    width: 150,
    accessor: (row) => row.department,
  },
  {
    id: "role",
    header: "Role",
    width: 180,
    accessor: (row) => row.role,
  },
  {
    id: "status",
    header: "Status",
    width: 120,
    alignment: "center",
    accessor: (row) => row.status,
  },
  {
    id: "salary",
    header: "Salary",
    width: 130,
    alignment: "right",
    accessor: (row) => row.salary,
  },
  {
    id: "startDate",
    header: "Start date",
    width: 140,
    accessor: (row) => row.startDate,
  },
  {
    id: "location",
    header: "Location",
    width: 130,
    accessor: (row) => row.location,
  },
  {
    id: "performance",
    header: "Performance",
    width: 130,
    alignment: "right",
    accessor: (row) => row.performance,
  },
  {
    id: "manager",
    header: "Manager",
    width: 170,
    accessor: (row) => row.manager,
  },
] satisfies readonly ColumnDefinition<EmployeeRow>[];
