// Single source of truth for the pipeline topology shown in the live diagram.
// Mirrors docs/diagrams/container-diagram.md — kept as data here (rather than
// duplicated in the frontend) so the diagram can never silently drift from what
// this service actually subscribes to.
const NODES = [
  { id: 'ops-event-publisher', label: 'ops-event-publisher', x: 40, y: 200 },
  { id: 'crew-impact-evaluator', label: 'crew-impact-evaluator', x: 340, y: 60 },
  { id: 'engineering-defect-linker', label: 'engineering-defect-linker', x: 340, y: 160 },
  { id: 'reaccommodation-engine', label: 'reaccommodation-engine', x: 340, y: 260 },
  { id: 'guest-translation-layer', label: 'guest-translation-layer', x: 640, y: 260 },
  { id: 'notification-dispatcher', label: 'notification-dispatcher', x: 940, y: 200 },
  { id: 'etl', label: 'etl (ODS + lakehouse)', x: 640, y: 380 },
];

const TOPICS = {
  'flight.disrupted': {
    producedBy: 'ops-event-publisher',
    consumedBy: ['crew-impact-evaluator', 'engineering-defect-linker', 'reaccommodation-engine', 'etl'],
  },
  'crew.legality-check': {
    producedBy: 'crew-impact-evaluator',
    consumedBy: ['etl'],
  },
  'ops.reaccommodation-generated': {
    producedBy: 'reaccommodation-engine',
    consumedBy: ['guest-translation-layer'],
  },
  'guest.itinerary-reaccommodated': {
    producedBy: 'guest-translation-layer',
    consumedBy: ['notification-dispatcher', 'etl'],
  },
};

module.exports = { NODES, TOPICS, TOPIC_NAMES: Object.keys(TOPICS) };
