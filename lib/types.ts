export type Post={id:string;title:string;slug:string;excerpt:string|null;content:string;contentFormat:'HTML'|'MARKDOWN';coverImage:string|null;status:'DRAFT'|'PUBLISHED';publishedAt:string|null;createdAt:string;updatedAt:string;categoryId:string|null;categoryName?:string|null;categorySlug?:string|null;seoTitle?:string|null;seoDescription?:string|null;seoKeywords?:string|null;ogImage?:string|null;canonicalUrl?:string|null;noindex?:number}
export type Category={id:string;name:string;slug:string}
export type Tag={id:string;name:string;slug:string}
