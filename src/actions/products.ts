"use server";

import { getPayload } from "payload";
import configPromise from "@/payload.config";
import { headers } from "next/headers";
import { getAuthToken } from "./auth";
import { revalidatePath } from "next/cache";
import { Product } from "@/payload-types";

export async function getUserProducts() {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const headersList = await headers();
    const payload = await getPayload({ config: configPromise });

    const { user } = await payload.auth({
      headers: headersList,
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get user's products
    const products = await payload.find({
      collection: "products",
      where: {
        "seller.id": {
          equals: user.id,
        },
      },
    });

    return products.docs;
  } catch (error: Error | unknown) {
    console.error("Get products error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function deleteProduct(productId: string) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const headersList = await headers();
    const payload = await getPayload({ config: configPromise });

    const { user } = await payload.auth({
      headers: headersList,
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify the product belongs to the user
    const product = await payload.findByID({
      collection: "products",
      id: productId,
    });

    if (typeof product.seller !== "string" && product.seller.id !== user.id) {
      // Fix the seller ID check
      throw new Error("Unauthorized");
    }

    // Delete the product
    await payload.delete({
      collection: "products",
      id: productId,
    });

    return { success: true };
  } catch (error: Error | unknown) {
    console.error("Delete product error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProductStatus(
  productId: string,
  status: "draft" | "active",
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const headersList = await headers();
    const payload = await getPayload({ config: configPromise });

    const { user } = await payload.auth({
      headers: headersList,
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify the product belongs to the user
    const product = await payload.findByID({
      collection: "products",
      id: productId,
    });

    if (typeof product.seller !== "string" && product.seller.id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Update the product status
    const updatedProduct = await payload.update({
      collection: "products",
      id: productId,
      data: {
        status,
      },
    });

    return updatedProduct;
  } catch (error: Error | unknown) {
    console.error("Update product status error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function createProduct(data: {
  name: string;
  description: string;
  productType:
    | "website-template"
    | "design-asset"
    | "3d-model"
    | "font"
    | "cad-file"
    | "ui-kit"
    | "other";
  category: string;
  technology: string[];
  price: number;
  licensingOptions:
    | "single-use"
    | "multiple-use"
    | "commercial"
    | "personal"
    | null
    | undefined;
  status: "draft" | "active" | "inactive" | "rejected";
}) {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const headersList = await headers();
    const payload = await getPayload({ config: configPromise });

    const { user } = await payload.auth({
      headers: headersList,
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Create the product
    // TODO: Fix later
    const product = await payload.create({
      collection: "products",
      data: {
        name: data.name,
        description: data.description,
        productType: data.productType,
        category: data.category,
        technology: data.technology,
        price: data.price,
        licensingOptions: data.licensingOptions,
        status: data.status,
        seller: user.id, // Set the current user as seller
      },
    });

    revalidatePath("/products");
    return { success: true, data: product };
  } catch (error: Error | unknown) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

interface UpdateProductResult {
  success: boolean;
  error?: string;
  data?: Product;
}

export async function updateProduct(
  id: string,
  data: Partial<Product>,
): Promise<UpdateProductResult> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Unauthorized");
    }

    const headersList = await headers();
    const payload = await getPayload({ config: configPromise });

    const { user } = await payload.auth({
      headers: headersList,
    });

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify the product belongs to the user
    const product = await payload.findByID({
      collection: "products",
      id,
    });

    if (typeof product.seller !== "string" && product.seller.id !== user.id) {
      throw new Error("Unauthorized - You can only edit your own products");
    }

    // Update the product
    const updatedProduct = await payload.update({
      collection: "products",
      id,
      data,
    });

    revalidatePath("/products/" + id);

    return {
      success: true,
      data: updatedProduct,
    };
  } catch (error: Error | unknown) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export const getProduct = async (id: string) => {
  try {
    const payload = await getPayload({ config: configPromise });
    const product = await payload.findByID({
      collection: "products",
      id,
    });

    return {
      success: true,
      data: product,
    };
  } catch (error: Error | unknown) {
    console.error("Error getting product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get product",
    };
  }
};

export const getAllProducts = async () => {
  try {
    const payload = await getPayload({ config: configPromise });
    const products = await payload.find({
      collection: "products",
      limit: 0,
    });

    return {
      success: true,
      data: products.docs,
    };
  } catch (error: Error | unknown) {
    console.error("Error getting products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get products",
    };
  }
};
