import type { CustomCategory, CustomCategoryInput } from '@money-mapper/shared';
export declare function getCustomCategories(customerId: string): Promise<CustomCategory[]>;
export declare function getCustomCategory(customerId: string, id: string): Promise<CustomCategory | null>;
export declare function createCustomCategory(customerId: string, input: CustomCategoryInput): Promise<CustomCategory>;
export declare function updateCustomCategory(customerId: string, id: string, input: Partial<CustomCategoryInput>): Promise<boolean>;
export declare function deleteCustomCategory(customerId: string, id: string): Promise<boolean>;
//# sourceMappingURL=custom-category-helpers.d.ts.map