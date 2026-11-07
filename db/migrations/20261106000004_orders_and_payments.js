// Step 6 (architecture §8): orders, order_items, payments, payment_events.
// gen_random_uuid() is built into PostgreSQL 13+.

const ORDER_STATUSES = ['pending_payment', 'new', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAYMENT_STATUSES = ['pending', 'success', 'failure', 'refunded'];
const inList = (values) => values.map((v) => `'${v}'`).join(', ');

/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('orders', (t) => {
    t.increments('id');
    t.text('number').notNullable().unique({ indexName: 'orders_number_unique' }); // public order number
    t.uuid('access_token').notNullable().defaultTo(knex.raw('gen_random_uuid()'))
      .unique({ indexName: 'orders_access_token_unique' }); // guest access link
    t.text('locale').notNullable().defaultTo('uk').references('code').inTable('locales')
      .onDelete('RESTRICT').onUpdate('CASCADE'); // language of emails / order page
    t.text('status').notNullable().defaultTo('new');
    t.text('payment_method').notNullable();

    // Buyer
    t.text('buyer_first_name').notNullable();
    t.text('buyer_last_name').notNullable();
    t.text('buyer_phone').notNullable();
    t.text('buyer_email');
    t.text('contact_channel'); // preferred channel: phone, viber, telegram…

    // Optional gift recipient
    t.text('recipient_first_name');
    t.text('recipient_last_name');
    t.text('recipient_phone');

    // Nova Poshta
    t.text('np_city_ref');
    t.text('np_city_name');
    t.text('np_warehouse_ref');
    t.text('np_warehouse_name');
    t.text('np_ttn');

    // Totals (UAH)
    t.decimal('items_total', 10, 2).notNullable();
    t.decimal('delivery_cost', 10, 2).notNullable().defaultTo(0);
    t.decimal('total', 10, 2).notNullable();

    t.text('comment');
    t.timestamp('paid_at', { useTz: true });
    t.timestamp('shipped_at', { useTz: true });
    t.timestamp('cancelled_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check(`status IN (${inList(ORDER_STATUSES)})`, [], 'orders_status_check');
    t.check("payment_method IN ('card', 'cod')", [], 'orders_payment_method_check');
    t.check('items_total >= 0 AND delivery_cost >= 0 AND total >= 0', [], 'orders_totals_check');
    t.index(['status', 'created_at'], 'orders_status_created_idx');
    t.index(['created_at'], 'orders_created_at_idx');
    t.index(['buyer_phone'], 'orders_buyer_phone_idx');
  });

  await knex.schema.createTable('order_items', (t) => {
    t.increments('id');
    t.integer('order_id').notNullable().references('id').inTable('orders').onDelete('CASCADE');
    t.integer('variant_id').notNullable().references('id').inTable('product_variants').onDelete('RESTRICT');
    // Snapshot at purchase time
    t.text('product_title').notNullable();
    t.text('article');
    t.text('size_label');
    t.decimal('weight_g', 8, 3);
    t.decimal('unit_price', 10, 2).notNullable(); // price paid
    t.decimal('original_price', 10, 2); // crossed-out price, if on sale
    t.integer('quantity').notNullable().defaultTo(1);

    t.check('unit_price >= 0', [], 'order_items_unit_price_check');
    t.check('original_price IS NULL OR original_price >= 0', [], 'order_items_original_price_check');
    t.check('quantity > 0', [], 'order_items_quantity_check');
    t.index(['order_id'], 'order_items_order_idx');
    t.index(['variant_id'], 'order_items_variant_idx');
  });

  await knex.schema.createTable('payments', (t) => {
    t.increments('id');
    t.integer('order_id').notNullable().references('id').inTable('orders').onDelete('RESTRICT');
    t.text('liqpay_order_id').notNullable().unique({ indexName: 'payments_liqpay_order_id_unique' }); // one per attempt
    t.text('liqpay_payment_id');
    t.decimal('amount', 10, 2).notNullable();
    t.specificType('currency', 'char(3)').notNullable().defaultTo('UAH');
    t.text('status').notNullable().defaultTo('pending');
    t.timestamp('paid_at', { useTz: true });
    t.timestamp('refunded_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check(`status IN (${inList(PAYMENT_STATUSES)})`, [], 'payments_status_check');
    t.check('amount > 0', [], 'payments_amount_check');
    t.index(['order_id'], 'payments_order_idx');
  });

  // At most one successful payment per order.
  await knex.raw(
    "CREATE UNIQUE INDEX payments_one_success_per_order ON payments (order_id) WHERE status = 'success'"
  );

  await knex.schema.createTable('payment_events', (t) => {
    t.bigIncrements('id');
    t.integer('payment_id').notNullable().references('id').inTable('payments').onDelete('RESTRICT');
    t.text('idempotency_key').notNullable().unique({ indexName: 'payment_events_idempotency_key_unique' }); // payment_id + status
    t.text('source').notNullable().defaultTo('callback');
    t.jsonb('payload').notNullable(); // raw LiqPay callback / API response
    t.boolean('signature_valid').notNullable();
    t.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.check("source IN ('callback', 'api')", [], 'payment_events_source_check');
    t.index(['payment_id'], 'payment_events_payment_idx');
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('payment_events');
  await knex.schema.dropTable('payments');
  await knex.schema.dropTable('order_items');
  await knex.schema.dropTable('orders');
};
