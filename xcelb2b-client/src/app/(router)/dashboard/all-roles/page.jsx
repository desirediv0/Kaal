"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, Trash, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../../../../context/AuthContext";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const Role = {
  Manager: "Manager",
  Sales: "Sales",
  ProductManager: "ProductManager",
};

const RoleDisplay = {
  Manager: "Manager",
  Sales: "Sales",
  ProductManager: "Product Manager",
};

export default function ImprovedUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editField, setEditField] = useState(null);
  const [maxUsers, setMaxUsers] = useState(0);
  const { checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchMaxUsers();
    fetchUsers();
  }, []);

  const fetchMaxUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      const response = await axios.get(`${apiUrl}/user/user-limit`);
      setMaxUsers(response.data.data.maxRole - 1);
    } catch (err) {
      setError("Failed to fetch user limit. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch user limit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      const response = await axios.get(`${apiUrl}/user/users`);
      setUsers(response.data.data);
    } catch (err) {
      setError("Failed to fetch users. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      const updatedData = { [editField]: editingUser[editField] };
      await axios.put(`${apiUrl}/user/users/${editingUser.id}`, updatedData);
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? { ...user, [editField]: editingUser[editField] }
            : user
        )
      );
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      let errorMessage = "An error occurred while updating the user.";
      if (error.response?.data?.includes("User already exists")) {
        errorMessage = "Error: User already exists with this email";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const isAuth = await checkAuth();
      if (!isAuth) {
        router.push("/");
        return;
      }
      await axios.delete(`${apiUrl}/user/users/${deletingUser.id}`);
      setUsers(users.filter((user) => user.id !== deletingUser.id));
      setDeleteDialogOpen(false);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      let errorMessage = "An error occurred while deleting the user.";
      if (error.response?.data?.includes("User not found")) {
        errorMessage = "Error: User not found";
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !users.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !users.length) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-3">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-primary">
          All Roles
        </h1>
        <Button
          onClick={() => router.push("/dashboard/create-role")}
          disabled={users.length >= maxUsers}
          className="bg-primary hover:bg-primary-dark text-white text-xs sm:text-sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>
      {users.length >= maxUsers && (
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8"
          role="alert"
        >
          <p className="font-bold">Warning</p>
          <p>
            You have reached the maximum number of roles. Please delete an
            existing role to create a new one. If you need assistance, please
            contact the Xcel B2B team.
          </p>
        </div>
      )}
      {users.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No users found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[250px]">Email</TableHead>
                <TableHead className="w-[150px]">Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{RoleDisplay[user.role]}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Select a field to edit for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-field" className="text-right">
                Field to Edit
              </Label>
              <Select
                onValueChange={(value) => setEditField(value)}
                value={editField}
              >
                <SelectTrigger className="col-span-3 text-black">
                  <SelectValue placeholder="Select a field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="role">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editField && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-value" className="text-right">
                  New Value
                </Label>
                {editField === "role" ? (
                  <Select
                    value={editingUser?.role || ""}
                    onValueChange={(value) =>
                      setEditingUser({ ...editingUser, role: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(Role).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {RoleDisplay[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="edit-value"
                    value={editingUser?.[editField] || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        [editField]: e.target.value,
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        confirmEdit(e);
                      }
                    }}
                    className="col-span-3"
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setEditDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={confirmEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  confirmEdit(e);
                }
              }}
              disabled={loading || !editField}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingUser?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
