export type CustomCategory = {
    id: string;
    customerId: string;
    name: string;
    keywords: string[];
    color: string;
    createdAt: Date;
    updatedAt: Date;
};
export type CustomCategoryInput = {
    name: string;
    keywords: string[];
    color?: string;
};
//# sourceMappingURL=custom-category.d.ts.map