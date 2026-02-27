import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation } from '@/lib/notifications';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-01-27.acacia' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    // Using await headers() as per newer Next.js patterns, or directly headers()
    // Wait, req.headers.get works just fine in edge/node API routes.
    const sig = req.headers.get('stripe-signature');

    if (!sig || !endpointSecret) {
        console.warn('[Stripe Webhook] Missing signature or webhook secret');
        return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`[Stripe Webhook] Error verifying signature: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Order ID is stored in client_reference_id
        const orderRef = session.client_reference_id;
        const stripeRef = session.payment_intent || session.id;

        console.log(`[Stripe Webhook] Payment SUCCESS for Order ${orderRef}`);

        if (!orderRef) {
            console.error('[Stripe Webhook] Missing client_reference_id in session');
            return NextResponse.json({ error: 'Missing client_reference_id' }, { status: 400 });
        }

        try {
            // Check if order exists
            const { data: existingOrder, error: fetchError } = await supabaseAdmin
                .from('orders')
                .select('id, order_number, payment_status, total')
                .eq('order_number', orderRef)
                .single();

            if (fetchError || !existingOrder) {
                console.error('[Stripe Webhook] Order not found:', orderRef);
                return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
            }

            // Check if already paid
            if (existingOrder.payment_status === 'paid') {
                console.log('[Stripe Webhook] Order already paid, skipping:', orderRef);
                return NextResponse.json({ success: true, message: 'Order already processed' });
            }

            // Mark order as paid via RPC
            const { data: orderJson, error: updateError } = await supabaseAdmin
                .rpc('mark_order_paid', {
                    order_ref: orderRef,
                    moolre_ref: String(stripeRef) // Reusing this field for Stripe Ref as well
                });

            if (updateError) {
                console.error('[Stripe Webhook] RPC Error:', updateError.message);
                return NextResponse.json({ success: false, message: 'Database update failed' }, { status: 500 });
            }

            if (!orderJson) {
                console.error('[Stripe Webhook] Order not found after RPC:', orderRef);
                return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
            }

            console.log('[Stripe Webhook] Order updated! ID:', orderJson.id, '| Status:', orderJson.status);

            // Update customer stats
            try {
                if (orderJson.email) {
                    await supabaseAdmin.rpc('update_customer_stats', {
                        p_customer_email: orderJson.email,
                        p_order_total: orderJson.total
                    });
                }
            } catch (statsError: any) {
                console.error('[Stripe Webhook] Customer stats failed:', statsError.message);
            }

            // Send SMS + Email notifications
            try {
                console.log('[Stripe Webhook] Sending notifications for:', orderJson.order_number);
                await sendOrderConfirmation(orderJson);
                console.log('[Stripe Webhook] Notifications sent!');
            } catch (notifyError: any) {
                console.error('[Stripe Webhook] Notification failed:', notifyError.message);
            }

        } catch (dbError: any) {
            console.error('[Stripe Webhook] DB handling error:', dbError.message);
            return NextResponse.json({ error: 'Database handling error' }, { status: 500 });
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
}
