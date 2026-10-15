import { Box } from "@chakra-ui/react";

// Small corner label with the git branch and commit this UI was built from,
// so it's obvious whether the kiosk runs a live or a test (garage-test) build.
const BuildBadge = () => (
  <Box
    position="fixed"
    bottom="4px"
    left="6px"
    zIndex={2000}
    fontSize="xs"
    fontFamily="monospace"
    color="whiteAlpha.600"
    pointerEvents="none"
  >
    {__BUILD_BRANCH__} @ {__BUILD_COMMIT__}
  </Box>
);

export default BuildBadge;
