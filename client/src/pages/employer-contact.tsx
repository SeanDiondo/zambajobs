import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const contactSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function EmployerContact() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "normal",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactForm) => {
      const fullName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.firstName || user?.lastName || "Unknown";
      
      return await apiRequest("POST", "/api/contact", {
        userId: user?.id,
        name: fullName,
        email: user?.email || "",
        subject: data.subject,
        message: data.message,
        priority: data.priority,
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Message sent successfully!", 
        description: "Our support team will get back to you soon." 
      });
      form.reset();
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error sending message", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (data: ContactForm) => {
    contactMutation.mutate(data);
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Contact Support</h1>
        <p className="text-muted-foreground">
          Have a question or need assistance? Send us a message and our support team will help you.
        </p>
      </div>

      {submitted && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Message Sent Successfully!</p>
              <p className="text-sm text-green-700 dark:text-green-300">We'll respond to your inquiry as soon as possible.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send a Message
          </CardTitle>
          <CardDescription>
            Fill out the form below to contact our support team. We typically respond within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Brief description of your inquiry"
                        data-testid="input-contact-subject"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-contact-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - General inquiry</SelectItem>
                        <SelectItem value="normal">Normal - Standard support</SelectItem>
                        <SelectItem value="high">High - Important issue</SelectItem>
                        <SelectItem value="urgent">Urgent - Critical problem</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe your question or issue in detail..."
                        rows={8}
                        data-testid="input-contact-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => form.reset()}
                  disabled={contactMutation.isPending}
                  data-testid="button-reset-contact"
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  data-testid="button-submit-contact"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {contactMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Ways to Reach Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Email</h4>
            <p className="text-sm text-muted-foreground">support@zambajobs.com</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Response Time</h4>
            <p className="text-sm text-muted-foreground">
              We aim to respond to all inquiries within 24 hours during business days.
              Urgent issues are prioritized and typically receive a response within 4-8 hours.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
