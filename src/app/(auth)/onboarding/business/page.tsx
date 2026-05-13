'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import api from '@/lib/axios';

const businessSchema = z.object({
  companyName: z.string().min(2, 'Company name is too short'),
  taxId: z.string().min(9, 'Invalid Tax ID / EIN'),
  address: z.string().min(5, 'Address is too short'),
  dotNumber: z.string().optional(),
  mcNumber: z.string().optional(),
});

type BusinessValues = z.infer<typeof businessSchema>;

export default function BusinessStep() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BusinessValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      companyName: '',
      taxId: '',
      address: '',
      dotNumber: '',
      mcNumber: '',
    },
  });

  async function onSubmit(data: BusinessValues) {
    setIsLoading(true);
    try {
      await api.patch('/auth/onboarding/business', {
        companyName: data.companyName,
        mcNumber: data.mcNumber,
        dotNumber: data.dotNumber,
        address: {
          line1: data.address,
          line2: '',
          city: '',
          state: '',
          zip: '',
        },
      });
      toast.success('Business details saved!');
      router.push('/onboarding/stripe');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update business details');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink">Business Information</h2>
        <p className="text-sm text-muted">Provide your company details for verification.</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input placeholder="Flow Logistics LLC" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax ID / EIN</FormLabel>
                  <FormControl>
                    <Input placeholder="12-3456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Logistics Way, TX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <FormField
              control={form.control}
              name="dotNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USDOT Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormDescription>Required for carriers</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mcNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MC Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormDescription>Required for carriers/brokers</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Back
            </Button>
            <Button type="submit" disabled={isLoading} className="h-10 rounded-md bg-primary text-primary-foreground hover:bg-primary-active transition-colors text-sm font-semibold">
              {isLoading ? 'Saving...' : 'Next: Payment Setup'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
