import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-01-27.acacia' as any, // use any just in case it's not the exact version string type
});

export async function POST(req: Request) {
    try {
        const { orderId, amount, customerEmail } = await req.json();

        if (!orderId || !amount || !customerEmail) {
            return NextResponse.json(
                { success: false, message: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Convert amount to cents (since your existing app is using whole numbers for USD/GHS, assume USD whole numbers? Or maybe it's GHS)
        // The existing moolre code does: amount: total. Total is likely simply the numeric value.
        // Stripe requires amount in smallest currency unit (e.g., cents for USD, pesewas for GHS).
        // Let's assume the store is in USD as per checkout/page.tsx line 156: currency: 'USD'.
        const amountInCents = Math.round(amount * 100);

        // Get the base URL for redirects
        // Depending on deployed env, use host from req or vercel URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
            (req.headers.get('origin') || `http://${req.headers.get('host')}`);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customerEmail,
            client_reference_id: orderId, // We use this to identify the order in webhook
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Order ${orderId}`,
                        },
                        unit_amount: amountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${baseUrl}/order-success?order=${orderId}&payment_success=true`,
            cancel_url: `${baseUrl}/checkout`, // Redirect back to checkout if canceled
        });

        return NextResponse.json({ success: true, url: session.url });
    } catch (error: any) {
        console.error('Stripe create-checkout-session error:', error.message);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
