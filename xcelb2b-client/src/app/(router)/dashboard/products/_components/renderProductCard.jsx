import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const RenderProductCard = ({ product, handleDelete }) => {
  const {
    id,
    title,
    slug,
    categories,
    subCategories,
    price,
    salePrice,
    image,
  } = product;

  return (
    <TableRow key={id} className="hover:bg-muted">
      <TableCell>
        {image ? (
          <Image
            src={image}
            alt={title}
            width={80}
            height={80}
            className="rounded-md object-cover"
          />
        ) : (
          "N/A"
        )}
      </TableCell>
      <TableCell className="font-medium">{title || "Untitled"}</TableCell>
      <TableCell className="hidden md:table-cell">
        {slug || "No slug"}
      </TableCell>
      <TableCell>
        {categories.map((category) => category.name).join(", ")}
        {subCategories && subCategories.length > 0 && (
          <>
            <br />
            <span className="text-sm text-gray-500">
              {subCategories.map((sub) => sub.subCategory.name).join(", ")}
            </span>
          </>
        )}
      </TableCell>
      <TableCell>
        {salePrice ? (
          <>
            <span className="text-red-500 font-semibold">
              ₹{salePrice.toFixed(2)}
            </span>
            <br />
            <span className="text-sm line-through text-gray-500">
              ₹{price.toFixed(2)}
            </span>
          </>
        ) : price ? (
          `₹${price.toFixed(2)}`
        ) : (
          "N/A"
        )}
      </TableCell>
      <TableCell>
        {salePrice ? (
          <span className="text-green-500 font-semibold">
            {((1 - salePrice / price) * 100).toFixed(0)}% off
          </span>
        ) : (
          "N/A"
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/products/${slug}`}>Edit</Link>
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the product from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(slug)}
                    className="bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default RenderProductCard;
