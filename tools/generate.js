const {
  generateTemplateFiles,
  CaseConverterEnum,
} = require('generate-template-files');

generateTemplateFiles([
  {
    option: 'Create new use case with controller',
    defaultCase: CaseConverterEnum.PascalCase,
    entry: {
      folderPath: './tools/templates',
    },
    stringReplacers: ['__name__', '__module__', '__repo__'],
    output: {
      path: './src/modules/__module__(lowerCase)/useCases/__name__(camelCase)',
      pathAndFileNameDefaultCase: CaseConverterEnum.PascalCase,
    },
    onComplete: results => {
      console.log(`results`, results);
    },
  },
]);