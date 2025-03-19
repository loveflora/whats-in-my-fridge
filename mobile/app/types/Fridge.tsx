export interface Category {
    _id: string;
    name: string;
    color: string;
    icon: string;
    owner: string;
  }
  
 export interface FridgeItem {
    _id: string;
    name: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    category: Category | string; // Updated to support both string and Category object
    favorite: boolean;
    completed: boolean;
  }