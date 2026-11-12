import { RoleMembre } from '@prisma/client';

export const STORE_PERMISSION_CATALOG = [
  { code: 'dashboard.view', module: 'dashboard', action: 'view' },
  {
    code: 'dashboard.view_financials',
    module: 'dashboard',
    action: 'view_financials',
  },
  { code: 'inventory.view', module: 'inventory', action: 'view' },
  { code: 'inventory.create', module: 'inventory', action: 'create' },
  { code: 'inventory.update', module: 'inventory', action: 'update' },
  {
    code: 'inventory.adjust_stock',
    module: 'inventory',
    action: 'adjust_stock',
  },
  {
    code: 'inventory.view_history',
    module: 'inventory',
    action: 'view_history',
  },
  {
    code: 'inventory.manage_locations',
    module: 'inventory',
    action: 'manage_locations',
  },
  { code: 'orders.view', module: 'orders', action: 'view' },
  { code: 'orders.accept', module: 'orders', action: 'accept' },
  { code: 'orders.update_status', module: 'orders', action: 'update_status' },
  { code: 'orders.cancel', module: 'orders', action: 'cancel' },
  { code: 'customers.view', module: 'customers', action: 'view' },
  {
    code: 'customers.view_contact',
    module: 'customers',
    action: 'view_contact',
  },
  {
    code: 'customers.view_order_history',
    module: 'customers',
    action: 'view_order_history',
  },
  {
    code: 'customers.view_address',
    module: 'customers',
    action: 'view_address',
  },
  { code: 'employees.view', module: 'employees', action: 'view' },
  { code: 'employees.create', module: 'employees', action: 'create' },
  { code: 'employees.update', module: 'employees', action: 'update' },
  { code: 'employees.remove', module: 'employees', action: 'remove' },
  {
    code: 'employees.manage_permissions',
    module: 'employees',
    action: 'manage_permissions',
  },
  { code: 'transactions.view', module: 'transactions', action: 'view' },
  {
    code: 'transactions.view_refunds',
    module: 'transactions',
    action: 'view_refunds',
  },
  { code: 'shop.view', module: 'shop', action: 'view' },
  { code: 'shop.update', module: 'shop', action: 'update' },
  { code: 'shop.manage_products', module: 'shop', action: 'manage_products' },
  { code: 'activity.view_all', module: 'activity', action: 'view_all' },
  { code: 'activity.view_own', module: 'activity', action: 'view_own' },
  { code: 'appointments.view', module: 'appointments', action: 'view' },
  { code: 'appointments.update', module: 'appointments', action: 'update' },
  { code: 'appointments.cancel', module: 'appointments', action: 'cancel' },
] as const;

export type StorePermissionCode =
  (typeof STORE_PERMISSION_CATALOG)[number]['code'];

export const STORE_PERMISSION_PRESETS = {
  read_only: [
    'dashboard.view',
    'inventory.view',
    'inventory.view_history',
    'orders.view',
    'customers.view',
    'shop.view',
    'activity.view_own',
  ],
  stock_manager: [
    'inventory.view',
    'inventory.create',
    'inventory.update',
    'inventory.adjust_stock',
    'inventory.view_history',
    'inventory.manage_locations',
  ],
  order_manager: ['orders.view', 'orders.accept', 'orders.update_status'],
  customer_service: [
    'customers.view',
    'customers.view_contact',
    'customers.view_order_history',
    'orders.view',
  ],
  custom: [],
} as const satisfies Record<string, readonly StorePermissionCode[]>;

export type StorePermissionPreset = keyof typeof STORE_PERMISSION_PRESETS;

export interface StorePermissionOverride {
  code: string;
  allowed: boolean;
}

export function isStorePermissionCode(
  code: string,
): code is StorePermissionCode {
  return STORE_PERMISSION_CATALOG.some(
    (permission) => permission.code === code,
  );
}

export function isStorePermissionPreset(
  preset: string,
): preset is StorePermissionPreset {
  return Object.prototype.hasOwnProperty.call(STORE_PERMISSION_PRESETS, preset);
}

export function permissionsForPreset(
  preset: StorePermissionPreset | null | undefined,
): StorePermissionCode[] {
  return preset ? [...STORE_PERMISSION_PRESETS[preset]] : [];
}

export function resolveStorePermissions(
  role: RoleMembre,
  preset: string | null,
  overrides: StorePermissionOverride[],
): Set<string> {
  if (role === RoleMembre.PROPRIETAIRE) {
    return new Set(STORE_PERMISSION_CATALOG.map(({ code }) => code));
  }
  const validPreset = preset && isStorePermissionPreset(preset) ? preset : null;
  const effective = new Set<string>(
    validPreset ? permissionsForPreset(validPreset) : [],
  );
  for (const override of overrides) {
    if (!isStorePermissionCode(override.code)) continue;
    if (override.allowed) effective.add(override.code);
    else effective.delete(override.code);
  }
  return effective;
}
