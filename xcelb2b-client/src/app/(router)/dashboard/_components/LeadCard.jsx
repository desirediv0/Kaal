"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Phone,
  Mail,
  MessageSquare,
  Edit,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Maximize,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../../../../../context/AuthContext";

const LeadStatus = {
  OnProgress: "onprocess",
  Converted: "Converted",
  NotInterested: "notinterested",
};

export function LeadCard({ lead, onStatusChange, onDelete }) {
  const {
    id,
    name,
    phone,
    email,
    message,
    subject,
    type,
    slug,
    comments: commentsLength,
    created_at,
    updated_at,
  } = lead;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [showAddComment, setShowAddComment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpdateMessage, setShowUpdateMessage] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isFullscreenDialogOpen, setIsFullscreenDialogOpen] = useState(false);
  const [isSubjectExpanded, setIsSubjectExpanded] = useState(false);

  const { checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isCommentsOpen) {
      fetchComments();
    }
  }, [id, isCommentsOpen]);

  const fetchComments = async () => {
    if (!isCommentsOpen) return;
    setLoading(true);
    setError("");
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/lead/${id}`
      );
      setComments(response.data.data.comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setError("Failed to fetch comments");
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    if (newComment.trim()) {
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/comments`,
          {
            message: newComment,
            lead_id: id,
          }
        );
        setComments([...comments, response.data.data]);
        setNewComment("");
        setShowAddComment(false);
        toast({
          title: "Success",
          description: "Comment added successfully",
        });
      } catch (error) {
        console.error("Error adding comment:", error);
        toast({
          title: "Error",
          description: "Failed to add comment",
          variant: "destructive",
        });
      }
    }
  };

  const editComment = async (commentId, newText) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`,
        {
          message: newText,
        }
      );
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, message: newText } : comment
        )
      );
      setEditingCommentId(null);
      setEditingCommentText("");
      setShowUpdateMessage(true);
      toast({
        title: "Success",
        description: "Comment updated successfully",
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    }
  };

  const deleteComment = async (commentId) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`
      );
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    }
  };

  const getHeaderColor = (type) => {
    switch (type) {
      case LeadStatus.OnProgress:
        return "bg-yellow-500";
      case LeadStatus.NotInterested:
        return "bg-red-500";
      case LeadStatus.Converted:
        return "bg-green-500";
      default:
        return "bg-primary";
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <Card className="w-full max-h-min shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className={`${getHeaderColor(type)} text-white p-4`}>
        <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <span className="text-lg font-bold">{name}</span>
          <Select
            onValueChange={(value) => onStatusChange(slug, value)}
            value={type}
          >
            <SelectTrigger className="w-[140px] bg-white text-black text-xs font-light">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LeadStatus.OnProgress}>On Progress</SelectItem>
              <SelectItem value={LeadStatus.NotInterested}>
                Not Interested
              </SelectItem>
              <SelectItem value={LeadStatus.Converted}>Converted</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p className="text-foreground">{phone}</p>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p className="text-foreground">{email}</p>
          </div>
        </div>
        <Collapsible
          open={isSubjectExpanded}
          onOpenChange={setIsSubjectExpanded}
          className="space-y-2"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 w-full justify-between"
            >
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="font-semibold">Subject</span>
              </div>
              {isSubjectExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="h-auto max-h-[200px] w-full rounded-md border p-4">
              <p className="text-foreground text-sm tracking-wide whitespace-pre-wrap">
                {subject || "No subject found."}
              </p>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
        <div>
          <p className="font-semibold text-foreground flex items-center mb-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground mr-2" />
            Message:
          </p>
          <ScrollArea className="h-[100px] w-full rounded-md border p-4 relative">
            <p className="text-foreground text-sm tracking-wide pr-8">
              {message || "No message found."}
            </p>
            <Dialog
              open={isFullscreenDialogOpen}
              onOpenChange={setIsFullscreenDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1"
                  onClick={() => setIsFullscreenDialogOpen(true)}
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] w-full max-h-[90vh] h-full flex flex-col m-auto">
                <DialogHeader>
                  <DialogTitle>Message</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-grow overflow-auto">
                  <div className="p-4">
                    <p className="text-foreground text-base leading-relaxed break-words">
                      {message || "No message found."}
                    </p>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </ScrollArea>
        </div>
      </CardContent>
      <CardContent className="p-4">
        <Collapsible
          open={isCommentsOpen}
          onOpenChange={setIsCommentsOpen}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <span className="font-semibold">Comments</span>
                <Badge variant="outline" className="text-xs font-medium">
                  {commentsLength?.length || 0}
                </Badge>
                {isCommentsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddComment(!showAddComment)}
              className="flex items-center"
            >
              {showAddComment ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {showAddComment ? "Cancel" : "Add Comment"}
            </Button>
          </div>
          <CollapsibleContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : comments.length === 0 ? (
              <p className="text-muted-foreground">No comments found.</p>
            ) : (
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-muted p-3 rounded-lg mb-2 text-muted-foreground"
                  >
                    {editingCommentId === comment.id ? (
                      <>
                        <Textarea
                          value={editingCommentText}
                          onChange={(e) =>
                            setEditingCommentText(e.target.value)
                          }
                          className="mt-2"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              editComment(comment.id, editingCommentText)
                            }
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex w-full justify-between items-center">
                          <p className="text-foreground">{comment.message}</p>
                          {comment.name && (
                            <p className="text-sm text-muted-foreground">
                              By: {comment.name}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {formatDate(comment.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {formatDate(comment.updated_at)}
                        </p>

                        <div className="flex justify-end space-x-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.message);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the comment.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteComment(comment.id)}
                                  className="bg-red-500 text-white hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </ScrollArea>
            )}
            {showUpdateMessage && (
              <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
                Comment updated successfully. If changes are not visible, please
                refresh the page.
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
        {showAddComment && (
          <div className="mt-4 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={addComment}>Add Comment</Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted rounded-b-lg p-4 space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-col justify-between items-start sm:items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Created: {formatDate(created_at)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Updated: {formatDate(updated_at)}</span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Lead</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                lead and remove the data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(slug)}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
