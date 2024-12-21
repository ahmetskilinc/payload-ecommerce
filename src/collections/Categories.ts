import { isAdmin } from "@/access/admin";
import { anyone } from "@/access/anyone";
import { CollectionConfig } from "payload";

export const Categories: CollectionConfig = {
  slug: "categories", // Collection identifier
  admin: {
    useAsTitle: "name", // Use the category name as the title in the admin interface
    defaultColumns: ["name", "slug", "createdAt"], // Display these columns in the admin UI table
    group: "Marketplace", // Organize the collection under a group in the admin UI
  },
  access: {
    read: anyone, // Allow everyone to read categories
    create: isAdmin, // Only admins can create categories
    update: isAdmin, // Only admins can update categories
    delete: isAdmin, // Only admins can delete categories
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      unique: true, // Ensure category names are unique
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "A URL-friendly identifier for the category (auto-generated if left blank).",
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (!data?.slug && data?.name) {
              data.slug = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, ""); // Generate slug
            }
          },
        ],
      },
    },
    {
      name: "description",
      type: "textarea",
      required: false,
      admin: {
        description: "Optional description of the category.",
      },
    },
    {
      name: "icon",
      type: "upload",
      relationTo: "media", // Assuming you have a "media" collection for file uploads
      required: false,
      admin: {
        description: "Optional icon for the category.",
      },
    },
    {
      name: "createdAt",
      type: "date",
      admin: {
        readOnly: true,
      },
      defaultValue: () => new Date().toISOString(), // Automatically fill with the current date
    },
  ],
};
