import { NextWebhookApiHandler, SaleorWebhook } from "@saleor/app-sdk/handlers/next";
import { gql } from "urql";
import { ProductUpdatedWebhookPayloadFragment } from "../../../../../generated/graphql";
import { saleorApp } from "../../../../../saleor-app";

// By using the fragment, we'll be able to get TS types for the payload
// Since this webhook subscribes for product updates, we have to create fragment on
// type ProductUpdated
export const ProductUpdatedWebhookPayload = gql`
  fragment ProductUpdatedWebhookPayload on ProductUpdated {
    product {
      id
      name
    }
  }
`;

// Subscription query which will be used to construct response for our webhook
export const ExampleProductUpdatedSubscription = gql`
  ${ProductUpdatedWebhookPayload}
  subscription ExampleProductUpdated {
    event {
      ...ProductUpdatedWebhookPayload
    }
  }
`;

// The SaleorWebhook class will help us define the webhook and provide handlers for API and manifest
// ProductUpdatedWebhookPayloadFragment is a fragment object generated by the codegen. We are using it to
// provide webhook payload types
export const productUpdatedWebhook = new SaleorWebhook<ProductUpdatedWebhookPayloadFragment>({
  name: "Example product updated webhook",
  webhookUrl: `/api/webhooks/saleor/product-updated`,
  asyncEvent: "PRODUCT_UPDATED",
  apl: saleorApp.apl,
  subscriptionQueryAst: ExampleProductUpdatedSubscription,
});

// productUpdatedWebhook object created earlier provides ready to use handler which validates incoming request.
// Also it will provide context object containing request properties and most importantly - typed payload.
export const handler: NextWebhookApiHandler<ProductUpdatedWebhookPayloadFragment> = async (
  req,
  res,
  context
) => {
  const { event, authData } = context;
  console.log(`New event ${event} from the ${authData.domain} domain has been received!`);
  const { product } = context.payload;
  if (product) {
    console.log(`Payload contains ${product.name} (id: ${product.id}) product`);
  }
  res.status(200).end();
};

// Next.js body parser has to be turned off to be able to access the raw body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default productUpdatedWebhook.handler(handler);
