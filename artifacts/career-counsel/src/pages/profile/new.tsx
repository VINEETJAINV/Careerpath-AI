import { useState } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProfile } from "@workspace/api-client-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.coerce.number().min(16).max(100).optional(),
  educationLevel: z.string().min(1, "Education level is required"),
  fieldOfStudy: z.string().optional(),
  workExperience: z.string().optional(),
  skills: z.string().optional(),
  interests: z.string().optional(),
  goals: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function NewProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProfile = useCreateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      educationLevel: "",
      fieldOfStudy: "",
      workExperience: "",
      skills: "",
      interests: "",
      goals: "",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    createProfile.mutate({ data }, {
      onSuccess: (profile) => {
        toast({
          title: "Profile created",
          description: "Welcome to CareerPath AI.",
        });
        localStorage.setItem("lastProfileId", String(profile.id));
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create profile. Please try again.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <AppLayout>
      <div className="container mx-auto max-w-2xl py-12 px-4">
        <Card className="border-2 shadow-sm">
          <CardHeader className="space-y-1 bg-muted/30 border-b pb-6">
            <CardTitle className="text-3xl font-display font-bold">Build Your Profile</CardTitle>
            <CardDescription className="text-base">
              The more honest you are, the better our guidance will be. Let's get to know you.
            </CardDescription>
            <p className="text-sm text-muted-foreground pt-1">
              Not sure what career you want?{" "}
              <a href="/discover" className="text-primary hover:underline font-medium">
                Let AI discover it with you instead
              </a>
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Basic Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="25" {...field} data-testid="input-age" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Academic & Professional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="educationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-education">
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="high_school">High School</SelectItem>
                              <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                              <SelectItem value="masters">Master's Degree</SelectItem>
                              <SelectItem value="phd">PhD / Doctorate</SelectItem>
                              <SelectItem value="bootcamp">Bootcamp / Self-Taught</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fieldOfStudy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field of Study / Major</FormLabel>
                          <FormControl>
                            <Input placeholder="Computer Science" {...field} data-testid="input-field" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="workExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Experience Summary</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Briefly describe your past roles..." 
                            className="resize-none" 
                            {...field} 
                            data-testid="input-experience"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Skills & Ambitions</h3>
                  <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Skills</FormLabel>
                        <FormControl>
                          <Input placeholder="Python, Public Speaking, Design..." {...field} data-testid="input-skills" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests & Passions</FormLabel>
                        <FormControl>
                          <Input placeholder="AI, Sustainable Energy, Writing..." {...field} data-testid="input-interests" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Career Goals</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Where do you see yourself? What do you want to achieve?" 
                            className="resize-none" 
                            {...field} 
                            data-testid="input-goals"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full sm:w-auto"
                    disabled={createProfile.isPending}
                    data-testid="button-submit-profile"
                  >
                    {createProfile.isPending ? "Creating..." : "Save Profile & Continue"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
