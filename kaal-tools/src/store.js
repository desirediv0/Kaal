import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./ProductSlicer";

export const store= configureStore({
 reducer:{
products : productsReducer,
 },

})