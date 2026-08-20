export const talosBpmnModdleDescriptor = {
  name: 'Talos',
  uri: 'urn:talos:bpmn:extensions:v0.1',
  prefix: 'talos',
  xml: {
    tagAlias: 'lowerCase',
  },
  associations: [],
  types: [
    {
      name: 'ActorRef',
      superClass: ['Element'],
      properties: [
        {
          name: 'canonicalRef',
          isAttr: true,
          type: 'String',
        },
      ],
    },
    {
      name: 'BusinessRuleRef',
      superClass: ['Element'],
      properties: [
        {
          name: 'canonicalRef',
          isAttr: true,
          type: 'String',
        },
      ],
    },
  ],
} as const;
