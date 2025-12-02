// ProductSlicer.js
import { createSlice } from "@reduxjs/toolkit";

export const ProductSlice = createSlice({
    name: "products",
    initialState: {
        allProducts: [],
        filteredProducts: [], // Initialize as empty array
    },
    reducers: {
        setProducts: (state, action) => {
            state.allProducts = action.payload;
            state.filteredProducts = action.payload;
        },
        filteredProducts: (state, action) => {
            const category = action.payload;
            state.filteredProducts = category === 'all'
                ? state.allProducts
                : state.allProducts.filter((product) => product.category === category);
        },
        filtersubcategory: (state, action) => {
            const subcategory = action.payload;
            state.filteredProducts = subcategory === 'all'
                ? state.allProducts
                : state.allProducts.filter((product) => product.subcategory === subcategory);
        },

    }
});

export const { setProducts, filteredProducts,filtersubcategory } = ProductSlice.actions;
export default ProductSlice.reducer;