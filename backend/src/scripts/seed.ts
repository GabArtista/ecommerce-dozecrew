import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  batchLinkProductsToCollectionWorkflow,
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["br"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "brl",
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Brasil",
          currency_code: "brl",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: [
      {
        country_code: "br",
        provider_id: "tp_system",
      },
    ],
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "Armazém Brasil",
          address: {
            city: "São Paulo",
            country_code: "BR",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });


  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Entrega Brasil",
    type: "shipping",
    service_zones: [
      {
        name: "Brasil",
        geo_zones: [
          {
            country_code: "br",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Frete Padrão",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Padrão",
          description: "Entrega em 5-8 dias úteis.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "brl",
            amount: 1990,
          },
          {
            region_id: region.id,
            amount: 1990,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Frete Expresso",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Expresso",
          description: "Entrega em 1-2 dias úteis.",
          code: "express",
        },
        prices: [
          {
            currency_code: "brl",
            amount: 3990,
          },
          {
            region_id: region.id,
            amount: 3990,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: {
      type: "publishable",
    },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Camisetas",
          is_active: true,
        },
        {
          name: "Moletons",
          is_active: true,
        },
        {
          name: "Calças",
          is_active: true,
        },
        {
          name: "Merch",
          is_active: true,
        },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Camiseta Doze Crew",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Camisetas")!.id,
          ],
          description:
            "Camiseta de algodão premium com acabamento de alta qualidade. Confortável para o dia a dia, com design minimalista e atemporal.",
          handle: "t-shirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png",
            },
          ],
          options: [
            {
              title: "Tamanho",
              values: ["P", "M", "G", "GG"],
            },
            {
              title: "Cor",
              values: ["Preto", "Branco"],
            },
          ],
          variants: [
            {
              title: "P / Preto",
              sku: "SHIRT-P-PRETO",
              options: {
                Tamanho: "P",
                Cor: "Preto",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "P / Branco",
              sku: "SHIRT-P-BRANCO",
              options: {
                Tamanho: "P",
                Cor: "Branco",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "M / Preto",
              sku: "SHIRT-M-PRETO",
              options: {
                Tamanho: "M",
                Cor: "Preto",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "M / Branco",
              sku: "SHIRT-M-BRANCO",
              options: {
                Tamanho: "M",
                Cor: "Branco",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "G / Preto",
              sku: "SHIRT-G-PRETO",
              options: {
                Tamanho: "G",
                Cor: "Preto",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "G / Branco",
              sku: "SHIRT-G-BRANCO",
              options: {
                Tamanho: "G",
                Cor: "Branco",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "GG / Preto",
              sku: "SHIRT-GG-PRETO",
              options: {
                Tamanho: "GG",
                Cor: "Preto",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "GG / Branco",
              sku: "SHIRT-GG-BRANCO",
              options: {
                Tamanho: "GG",
                Cor: "Branco",
              },
              prices: [
                {
                  amount: 8990,
                  currency_code: "brl",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Moletom Doze Crew",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Moletons")!.id,
          ],
          description:
            "Moletom de algodão premium com interior felpado. Perfeito para dias mais frios, com corte relaxado e acabamento de alta qualidade.",
          handle: "sweatshirt",
          weight: 600,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Tamanho",
              values: ["P", "M", "G", "GG"],
            },
          ],
          variants: [
            {
              title: "P",
              sku: "SWEATSHIRT-P",
              options: {
                Tamanho: "P",
              },
              prices: [
                {
                  amount: 14990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATSHIRT-M",
              options: {
                Tamanho: "M",
              },
              prices: [
                {
                  amount: 14990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "G",
              sku: "SWEATSHIRT-G",
              options: {
                Tamanho: "G",
              },
              prices: [
                {
                  amount: 14990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "GG",
              sku: "SWEATSHIRT-GG",
              options: {
                Tamanho: "GG",
              },
              prices: [
                {
                  amount: 14990,
                  currency_code: "brl",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Calça Doze Crew",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Calças")!.id,
          ],
          description:
            "Calça de moletom com elástico na cintura e punhos. Tecido macio e confortável, ideal para o dia a dia casual.",
          handle: "sweatpants",
          weight: 500,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png",
            },
          ],
          options: [
            {
              title: "Tamanho",
              values: ["P", "M", "G", "GG"],
            },
          ],
          variants: [
            {
              title: "P",
              sku: "SWEATPANTS-P",
              options: {
                Tamanho: "P",
              },
              prices: [
                {
                  amount: 12990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATPANTS-M",
              options: {
                Tamanho: "M",
              },
              prices: [
                {
                  amount: 12990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "G",
              sku: "SWEATPANTS-G",
              options: {
                Tamanho: "G",
              },
              prices: [
                {
                  amount: 12990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "GG",
              sku: "SWEATPANTS-GG",
              options: {
                Tamanho: "GG",
              },
              prices: [
                {
                  amount: 12990,
                  currency_code: "brl",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Shorts Doze Crew",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merch")!.id,
          ],
          description:
            "Shorts de algodão com elástico e cadarço na cintura. Leve e confortável para o verão ou academia.",
          handle: "shorts",
          weight: 300,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Tamanho",
              values: ["P", "M", "G", "GG"],
            },
          ],
          variants: [
            {
              title: "P",
              sku: "SHORTS-P",
              options: {
                Tamanho: "P",
              },
              prices: [
                {
                  amount: 9990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "M",
              sku: "SHORTS-M",
              options: {
                Tamanho: "M",
              },
              prices: [
                {
                  amount: 9990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "G",
              sku: "SHORTS-G",
              options: {
                Tamanho: "G",
              },
              prices: [
                {
                  amount: 9990,
                  currency_code: "brl",
                },
              ],
            },
            {
              title: "GG",
              sku: "SHORTS-GG",
              options: {
                Tamanho: "GG",
              },
              prices: [
                {
                  amount: 9990,
                  currency_code: "brl",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  // Buscar produtos criados para linkar às coleções
  const { data: allProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  });

  const findProduct = (handle: string) =>
    allProducts.find((p) => p.handle === handle);

  logger.info("Seeding homepage collections...");

  // Coleção featured: t-shirt, sweatshirt, shorts (mínimo 3 para ThreeItemGrid)
  const featuredHandles = ["t-shirt", "sweatshirt", "shorts"];
  const featuredProductIds = featuredHandles
    .map((h) => findProduct(h)?.id)
    .filter(Boolean) as string[];

  // Coleção carousel: todos os produtos
  const allProductIds = allProducts.map((p) => p.id);

  const { result: collectionsResult } = await createCollectionsWorkflow(
    container
  ).run({
    input: {
      collections: [
        {
          title: "Homepage Featured",
          handle: "hidden-homepage-featured-items",
        },
        {
          title: "Homepage Carousel",
          handle: "hidden-homepage-carousel",
        },
      ],
    },
  });

  const featuredCollection = collectionsResult.find(
    (c) => c.handle === "hidden-homepage-featured-items"
  );
  const carouselCollection = collectionsResult.find(
    (c) => c.handle === "hidden-homepage-carousel"
  );

  if (featuredCollection && featuredProductIds.length >= 3) {
    await batchLinkProductsToCollectionWorkflow(container).run({
      input: {
        id: featuredCollection.id,
        add: featuredProductIds,
        remove: [],
      },
    });
  }

  if (carouselCollection && allProductIds.length > 0) {
    await batchLinkProductsToCollectionWorkflow(container).run({
      input: {
        id: carouselCollection.id,
        add: allProductIds,
        remove: [],
      },
    });
  }

  logger.info("Finished seeding homepage collections.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
