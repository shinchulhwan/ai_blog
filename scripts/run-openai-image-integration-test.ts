import { openAIImageIntegrationTestService } from "../src/modules/integration-test/services/openai-image-integration-test.service";

async function main() {
  const result = await openAIImageIntegrationTestService.run();

  console.log(JSON.stringify(result, null, 2));

  if (result.status === "SKIPPED") {
    const mockOnlyFailed = result.tests.some((test) => !test.passed);
    console.log("OpenAI image integration test skipped — OPENAI_API_KEY not configured.");
    if (mockOnlyFailed) {
      process.exit(1);
    }
    return;
  }

  if (result.status !== "SUCCESS") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
