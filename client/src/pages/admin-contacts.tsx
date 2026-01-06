import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mail, AlertCircle, CheckCircle, Archive } from "lucide-react";
import type { ContactMessage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistance } from "date-fns";

interface MessageCardProps {
  message: ContactMessage;
  replyingTo: string | null;
  replyMessages: Record<string, string>;
  onSetReplyingTo: (id: string | null) => void;
  onSetReplyMessages: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  onUpdateMessage: (params: { id: string; status: string; replyMessage?: string; repliedBy?: string }) => void;
  isPending: boolean;
}

const MessageCard = memo(({ 
  message, 
  replyingTo, 
  replyMessages, 
  onSetReplyingTo, 
  onSetReplyMessages, 
  onUpdateMessage,
  isPending 
}: MessageCardProps) => (
  <Card key={message.id} className="hover-elevate" data-testid={`card-message-${message.id}`}>
    <CardHeader>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <CardTitle className="text-lg">{message.name}</CardTitle>
            <Badge variant={
              message.priority === 'urgent' ? 'destructive' :
              message.priority === 'high' ? 'default' : 'secondary'
            }>
              {message.priority}
            </Badge>
            <Badge variant="outline">{message.status}</Badge>
          </div>
          <CardDescription>
            {message.email} • {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true })}
          </CardDescription>
        </div>
      </div>
      {message.subject && (
        <p className="font-medium text-sm mt-2">Subject: {message.subject}</p>
      )}
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">{message.message}</p>
      
      {message.replyMessage && (
        <div className="bg-muted p-3 rounded-md mb-4">
          <p className="text-xs font-medium mb-1">Admin Reply:</p>
          <p className="text-sm">{message.replyMessage}</p>
        </div>
      )}

      {replyingTo === message.id ? (
        <div className="space-y-3">
          <Textarea
            placeholder="Type your reply..."
            value={replyMessages[message.id] || ""}
            onChange={(e) => onSetReplyMessages(prev => ({ ...prev, [message.id]: e.target.value }))}
            rows={4}
            data-testid={`textarea-reply-${message.id}`}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onUpdateMessage({
                id: message.id,
                status: 'replied',
                replyMessage: replyMessages[message.id] || ""
              })}
              disabled={!(replyMessages[message.id] || "").trim() || isPending}
              data-testid={`button-send-reply-${message.id}`}
            >
              Send Reply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onSetReplyingTo(null);
                onSetReplyMessages(prev => {
                  const newMessages = { ...prev };
                  delete newMessages[message.id];
                  return newMessages;
                });
              }}
              data-testid={`button-cancel-reply-${message.id}`}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          {message.status !== 'replied' && (
            <Button
              size="sm"
              onClick={() => {
                onSetReplyingTo(message.id);
                if (!replyMessages[message.id]) {
                  onSetReplyMessages(prev => ({ ...prev, [message.id]: "" }));
                }
              }}
              data-testid={`button-reply-${message.id}`}
            >
              <Mail className="h-4 w-4 mr-2" />
              Reply
            </Button>
          )}
          {message.status !== 'read' && message.status !== 'replied' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateMessage({ id: message.id, status: 'read' })}
              data-testid={`button-mark-read-${message.id}`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Read
            </Button>
          )}
          {message.status !== 'archived' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateMessage({ id: message.id, status: 'archived' })}
              data-testid={`button-archive-${message.id}`}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      )}
    </CardContent>
  </Card>
));

MessageCard.displayName = 'MessageCard';

export default function AdminContacts() {
  const { toast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});

  const { data: messages, isLoading, isError } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contacts"],
  });

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, status, replyMessage, repliedBy }: any) => {
      return await apiRequest("PUT", `/api/admin/contacts/${id}`, { 
        status, 
        replyMessage, 
        repliedBy 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
      setReplyingTo(null);
      setReplyMessages({});
      toast({ title: "Message updated", description: "Contact message updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const newMessages = messages?.filter(m => m.status === 'new' || m.status === 'read') || [];
  const repliedMessages = messages?.filter(m => m.status === 'replied') || [];
  const archivedMessages = messages?.filter(m => m.status === 'archived') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
        <p className="text-muted-foreground">Manage user inquiries and support requests</p>
      </div>
      {/* Fix applied: Per-message reply state */}

        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" data-testid="tab-new">
              New ({newMessages.length})
            </TabsTrigger>
            <TabsTrigger value="replied" data-testid="tab-replied">
              Replied ({repliedMessages.length})
            </TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived">
              Archived ({archivedMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading messages...
                </CardContent>
              </Card>
            ) : isError ? (
              <Card>
                <CardContent className="py-8 text-center text-destructive">
                  Failed to load messages
                </CardContent>
              </Card>
            ) : newMessages.length > 0 ? (
              newMessages.map(message => (
                <MessageCard 
                  key={message.id} 
                  message={message}
                  replyingTo={replyingTo}
                  replyMessages={replyMessages}
                  onSetReplyingTo={setReplyingTo}
                  onSetReplyMessages={setReplyMessages}
                  onUpdateMessage={updateMessageMutation.mutate}
                  isPending={updateMessageMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No new messages
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="replied" className="space-y-4 mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading messages...
                </CardContent>
              </Card>
            ) : repliedMessages.length > 0 ? (
              repliedMessages.map(message => (
                <MessageCard 
                  key={message.id} 
                  message={message}
                  replyingTo={replyingTo}
                  replyMessages={replyMessages}
                  onSetReplyingTo={setReplyingTo}
                  onSetReplyMessages={setReplyMessages}
                  onUpdateMessage={updateMessageMutation.mutate}
                  isPending={updateMessageMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No replied messages
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="archived" className="space-y-4 mt-6">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading messages...
                </CardContent>
              </Card>
            ) : archivedMessages.length > 0 ? (
              archivedMessages.map(message => (
                <MessageCard 
                  key={message.id} 
                  message={message}
                  replyingTo={replyingTo}
                  replyMessages={replyMessages}
                  onSetReplyingTo={setReplyingTo}
                  onSetReplyMessages={setReplyMessages}
                  onUpdateMessage={updateMessageMutation.mutate}
                  isPending={updateMessageMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No archived messages
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}
