import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import AsaasPaymentService from "./service";

export default ModuleProvider(Modules.PAYMENT, {
  services: [AsaasPaymentService],
});
