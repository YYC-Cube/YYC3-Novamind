import fs from 'fs';
import { parse } from '@babel/parser';
const content = fs.readFileSync('../../../../app/api/chat/route.ts', 'utf-8');
try {
  const ast = parse(content, { sourceType: 'module', plugins: ['typescript', 'decorators-legacy'] });
  console.log('parsed OK');
  // count ExportNamedDeclaration with FunctionDeclaration
  let count = 0;
  for (const node of ast.program.body) {
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'FunctionDeclaration') {
      count++;
      console.log('found function:', node.declaration.id.name, 'leadingComments:', node.leadingComments?.length);
    }
  }
  console.log('Total exported functions:', count);
} catch (e) {
  console.error('parse error:', e.message, 'at line', e.loc?.line, 'col', e.loc?.column);
}
