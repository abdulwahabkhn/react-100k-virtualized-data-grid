import type {
  EmployeeRow,
  EmployeeStatus,
} from "@/features/grid/model/grid.types";

const FIRST_NAMES = [
  "Aisha",
  "Amelia",
  "Arjun",
  "Daniel",
  "Elena",
  "Ethan",
  "Fatima",
  "Grace",
  "Hassan",
  "Isabella",
  "James",
  "Kenji",
  "Leila",
  "Lucas",
  "Maya",
  "Noah",
  "Priya",
  "Sofia",
  "Wei",
  "Zara",
] as const;

const LAST_NAMES = [
  "Anderson",
  "Chen",
  "Garcia",
  "Haddad",
  "Ibrahim",
  "Johnson",
  "Khan",
  "Kim",
  "Martinez",
  "Mensah",
  "Nakamura",
  "Okafor",
  "Patel",
  "Rahman",
  "Rossi",
  "Singh",
  "Smith",
  "Thompson",
  "Williams",
  "Zhang",
] as const;

type RoleProfile = readonly [
  role: string,
  minimumSalary: number,
  maximumSalary: number,
];

interface DepartmentProfile {
  readonly department: string;
  readonly roles: readonly RoleProfile[];
}

const DEPARTMENT_PROFILES: readonly DepartmentProfile[] = [
  {
    department: "Engineering",
    roles: [
      ["Software Engineer", 82_000, 142_000],
      ["Senior Software Engineer", 112_000, 178_000],
      ["Engineering Manager", 138_000, 205_000],
      ["Site Reliability Engineer", 105_000, 172_000],
    ],
  },
  {
    department: "Product",
    roles: [
      ["Product Manager", 98_000, 165_000],
      ["Senior Product Manager", 125_000, 190_000],
      ["Product Analyst", 70_000, 112_000],
    ],
  },
  {
    department: "Design",
    roles: [
      ["Product Designer", 78_000, 132_000],
      ["UX Researcher", 75_000, 126_000],
      ["Design Lead", 112_000, 168_000],
    ],
  },
  {
    department: "Finance",
    roles: [
      ["Financial Analyst", 68_000, 108_000],
      ["Senior Accountant", 76_000, 118_000],
      ["Finance Manager", 105_000, 158_000],
    ],
  },
  {
    department: "Operations",
    roles: [
      ["Operations Specialist", 58_000, 92_000],
      ["Program Manager", 84_000, 132_000],
      ["Operations Director", 122_000, 182_000],
    ],
  },
  {
    department: "People",
    roles: [
      ["People Partner", 72_000, 118_000],
      ["Talent Acquisition Lead", 80_000, 126_000],
      ["People Operations Manager", 96_000, 148_000],
    ],
  },
  {
    department: "Sales",
    roles: [
      ["Account Executive", 70_000, 128_000],
      ["Sales Development Representative", 52_000, 82_000],
      ["Regional Sales Manager", 108_000, 172_000],
    ],
  },
  {
    department: "Marketing",
    roles: [
      ["Marketing Specialist", 62_000, 98_000],
      ["Content Strategist", 68_000, 106_000],
      ["Marketing Director", 118_000, 176_000],
    ],
  },
] as const;

const LOCATIONS = [
  "Austin, US",
  "Berlin, Germany",
  "Dubai, UAE",
  "London, UK",
  "New York, US",
  "San Francisco, US",
  "Singapore",
  "Sydney, Australia",
  "Toronto, Canada",
  "Tokyo, Japan",
] as const;

const STATUSES: readonly EmployeeStatus[] = [
  "active",
  "active",
  "active",
  "active",
  "active",
  "active",
  "active",
  "on-leave",
  "on-leave",
  "review",
];

const DEFAULT_COUNT = 100_000;
const DEFAULT_SEED = 2026;

type RandomSource = () => number;

/**
 * Generates deterministic employee data with a compact, seeded PRNG.
 * The returned sequence is stable for the same count and numeric seed.
 */
export function generateEmployeeRows(
  count = DEFAULT_COUNT,
  seed = DEFAULT_SEED,
): EmployeeRow[] {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError(
      "Employee row count must be a non-negative safe integer.",
    );
  }

  const random = createRandomSource(seed);
  const rows = new Array<EmployeeRow>(count);

  for (let index = 0; index < count; index += 1) {
    const employeeNumber = index + 1;
    const identifier = String(employeeNumber).padStart(6, "0");
    const firstName = pick(FIRST_NAMES, random);
    const lastName = pick(LAST_NAMES, random);
    const profile = pick(DEPARTMENT_PROFILES, random);
    const [role, minimumSalary, maximumSalary] = pick(profile.roles, random);
    const managerFirstName = pick(FIRST_NAMES, random);
    let managerLastName = pick(LAST_NAMES, random);

    if (managerFirstName === firstName && managerLastName === lastName) {
      managerLastName = LAST_NAMES[(LAST_NAMES.indexOf(lastName) + 1) % LAST_NAMES.length];
    }

    rows[index] = {
      id: `employee-${identifier}`,
      employeeId: `EMP-${identifier}`,
      name: `${firstName} ${lastName}`,
      department: profile.department,
      role,
      status: pick(STATUSES, random),
      salary: randomSalary(minimumSalary, maximumSalary, random),
      startDate: randomStartDate(random),
      location: pick(LOCATIONS, random),
      performance: randomInteger(55, 100, random),
      manager: `${managerFirstName} ${managerLastName}`,
    };
  }

  return rows;
}

/** Mulberry32; numeric seeds are normalized to an unsigned 32-bit state. */
function createRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function pick<T>(values: readonly T[], random: RandomSource): T {
  return values[Math.floor(random() * values.length)];
}

function randomInteger(
  minimum: number,
  maximum: number,
  random: RandomSource,
): number {
  return minimum + Math.floor(random() * (maximum - minimum + 1));
}

function randomSalary(
  minimum: number,
  maximum: number,
  random: RandomSource,
): number {
  return Math.round(randomInteger(minimum, maximum, random) / 500) * 500;
}

function randomStartDate(random: RandomSource): string {
  const year = randomInteger(2012, 2025, random);
  const month = String(randomInteger(1, 12, random)).padStart(2, "0");
  const day = String(randomInteger(1, 28, random)).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
