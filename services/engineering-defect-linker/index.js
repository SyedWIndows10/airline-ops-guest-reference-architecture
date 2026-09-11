const { EventClient } = require('@airline-ops/shared');

const IN_TOPIC = 'flight.disrupted';

const client = new EventClient({ clientId: 'engineering-defect-linker' });

// Deliberately a thin stub — see services/engineering-defect-linker/package.json description
// and docs/02-solution-intent-irops.md ("what to show live vs. what to leave as docs").
// A real implementation would look up the tail number against the maintenance system's
// open MEL/defect records and publish an engineering.defect-linked.v1 event.
async function handleDisruption(disruptionEvent) {
  if (disruptionEvent.disruptionType !== 'MECHANICAL') {
    return;
  }
  console.log(
    `[engineering-defect-linker] correlating ${disruptionEvent.flightNumber} ` +
      `(tail ${disruptionEvent.tailNumber}) against mock defect records ` +
      `(correlationId=${disruptionEvent.correlationId})`
  );
}

async function main() {
  console.log(`[engineering-defect-linker] subscribing to "${IN_TOPIC}"`);
  await client.consume({
    groupId: 'engineering-defect-linker',
    topics: [IN_TOPIC],
    handler: handleDisruption,
  });
}

main().catch((err) => {
  console.error('[engineering-defect-linker] fatal error', err);
  process.exit(1);
});
