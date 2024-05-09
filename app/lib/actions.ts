"use server"; // All exported functions within the file are now server functions.

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Validate data types with zod:
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount * 100; // Convert amount into cents to eliminate JS floating-point errors and ensure greater accuracy
    const date = new Date().toISOString().split('T')[0]; // Create invoice's creation date with "YYY-MM-DD" format

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    } catch(error) {
        return { message: "Database Error: Failed to Create Invoice" }
    }

    revalidatePath('/dashboard/invoices'); // Clear cache and trigger new request to the server
    redirect('/dashboard/invoices'); // Redirect the user back to the /dashboard/invoices page
}

export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
   
    const amountInCents = amount * 100; // Convert amount into cents to eliminate JS floating-point errors and ensure greater accuracy
   
    try {
        await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
        `;
    } catch (error) {
        return { message: "Database Error: Failed to Update Invoice" }
    }

    revalidatePath('/dashboard/invoices'); // Clear cache and trigger new request to the server
    redirect('/dashboard/invoices'); // Redirect the user back to the /dashboard/invoices page
}

export async function deleteInvoice(id: string) {
    throw new Error("Failed to Delete Invoice");
    
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath("/dashboard/invoices"); // Clear cache and trigger new request to the server
        return { message: "Deleted Invoice." };
    } catch (error) {
        return { message: "Database Error: Failed to Delete Invoice" }
    }
}