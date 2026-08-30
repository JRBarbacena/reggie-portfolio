export const CONTENT_READINESS_SCHEMA = {
  $id: "urn:reggie-portfolio:content-readiness:v1",
  type: "object",
  additionalProperties: false,
  required: ["schemaId", "schemaVersion", "mode", "pages"],
  properties: {
    schemaId: { const: "urn:reggie-portfolio:content-readiness:v1" },
    schemaVersion: { const: 1 },
    mode: { enum: ["production", "fixture"] },
    pages: { type: "array", minItems: 1, items: { $ref: "#/$defs/page" } },
  },
  $defs: {
    state: { enum: ["draft", "approved", "omitted"] },
    file: { type: "string", pattern: "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9_.@/-]+$" },
    selector: { type: "string", minLength: 1 },
    section: {
      type: "object", additionalProperties: false,
      required: ["id", "kind", "selector", "previousState", "state", "render"],
      properties: {
        id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
        kind: { enum: ["content", "education", "career-history", "job-information", "design-entries"] },
        selector: { $ref: "#/$defs/selector" },
        previousState: { $ref: "#/$defs/state" }, state: { $ref: "#/$defs/state" },
        render: { type: "boolean" }, entryCount: { type: "integer", minimum: 0 },
      },
      allOf: [{
        if: { required: ["kind"], properties: { kind: { const: "design-entries" } } },
        then: {
          required: ["entryCount"],
          allOf: [{
            if: { required: ["render"], properties: { render: { const: true } } },
            then: { properties: { entryCount: { type: "integer", minimum: 1 } } },
            else: { properties: { entryCount: { type: "integer", const: 0 } } },
          }],
        },
        else: { not: { required: ["entryCount"] } },
      }],
    },
    asset: {
      type: "object", additionalProperties: false,
      required: ["id", "selector", "source", "previousState", "state", "decorative", "alt", "width", "height"],
      properties: {
        id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
        selector: { $ref: "#/$defs/selector" }, source: { $ref: "#/$defs/file" },
        previousState: { $ref: "#/$defs/state" }, state: { $ref: "#/$defs/state" },
        decorative: { type: "boolean" }, alt: { type: "string" },
        width: { type: "integer", minimum: 1 }, height: { type: "integer", minimum: 1 },
      },
      allOf: [{
        if: { properties: { decorative: { const: true } } },
        then: { properties: { alt: { const: "" } } },
        else: { properties: { alt: { type: "string", minLength: 1 } } },
      }],
    },

    link: {
      type: "object", additionalProperties: false,
      required: ["id", "selector", "target", "previousState", "state"],
      properties: {
        id: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" },
        selector: { $ref: "#/$defs/selector" }, target: { type: "string", minLength: 1 },
        previousState: { $ref: "#/$defs/state" }, state: { $ref: "#/$defs/state" },
      },
    },
    page: {
      type: "object", additionalProperties: false,
      required: ["id", "document", "releaseState", "sections", "assets", "links"],
      properties: {
        id: { enum: ["home", "tech", "designs"] },
        document: { $ref: "#/$defs/file" },
        releaseState: { enum: ["release-ready", "withheld"] },
        sections: { type: "array", minItems: 1, items: { $ref: "#/$defs/section" } },
        assets: { type: "array", items: { $ref: "#/$defs/asset" } },
        links: { type: "array", items: { $ref: "#/$defs/link" } },
      },
    },
  },
};
