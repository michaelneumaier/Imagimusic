/** Conservative notebook layout, not a complete Markdown interpreter.
 * Inline markup stays literal. All source content is inserted with textContent.
 * The caller retains the exact source for unsupported syntax and archival use. */
export function notebookBlocks(source){
 const lines=source.replace(/\r\n?/g,'\n').split('\n'),blocks=[];
 const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(cell=>cell.trim().replace(/\\\|/g,'|'));
 const separator=line=>/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
 const boundary=line=>!line.trim()||/^\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|\x60{3}|~{3})/.test(line);
 for(let i=0;i<lines.length;){
  const line=lines[i];
  if(!line.trim()){i++;continue;}
  const fence=line.match(/^\s*(\x60{3,}|~{3,})/);
  if(fence){const code=[],marker=fence[1];i++;while(i<lines.length&&!lines[i].trim().startsWith(marker))code.push(lines[i++]);if(i<lines.length)i++;blocks.push({kind:'code',text:code.join('\n')});continue;}
  const heading=line.match(/^\s*(#{1,6})\s+(.+)$/);
  if(heading){blocks.push({kind:'heading',level:Math.min(heading[1].length+1,6),text:heading[2]});i++;continue;}
  if(i+1<lines.length&&line.includes('|')&&separator(lines[i+1])){
   const header=cells(line),rows=[];i+=2;
   while(i<lines.length&&lines[i].trim()&&lines[i].includes('|'))rows.push(cells(lines[i++]));
   blocks.push({kind:'table',header,rows});continue;
  }
  const item=line.match(/^\s*([-*+]|\d+\.)\s+(.+)$/);
  if(item){
   const ordered=/\d/.test(item[1]),items=[];
   while(i<lines.length){const next=lines[i].match(/^\s*([-*+]|\d+\.)\s+(.+)$/);if(!next||/\d/.test(next[1])!==ordered)break;items.push(next[2]);i++;}
   blocks.push({kind:'list',ordered,items});continue;
  }
  if(/^\s*(?:---+|\*\*\*+)\s*$/.test(line)){blocks.push({kind:'rule'});i++;continue;}
  const paragraph=[line];i++;
  while(i<lines.length&&!boundary(lines[i])&&!(i+1<lines.length&&lines[i].includes('|')&&separator(lines[i+1])))paragraph.push(lines[i++]);
  blocks.push({kind:'paragraph',text:paragraph.join('\n')});
 }
 return blocks;
}
export function renderNotebook(target,source){
 const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 target.replaceChildren();
 for(const block of notebookBlocks(source)){
  if(block.kind==='heading')target.append(make('h'+block.level,block.text));
  else if(block.kind==='code')target.append(make('pre',block.text));
  else if(block.kind==='rule')target.append(make('hr'));
  else if(block.kind==='list'){const list=make(block.ordered?'ol':'ul');for(const item of block.items)list.append(make('li',item));target.append(list);}
  else if(block.kind==='table'){
   const region=make('div');region.className='notebook-table';region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label','Source table; scroll horizontally if needed');
   const table=make('table'),head=make('thead'),row=make('tr'),body=make('tbody');
   for(const cell of block.header){const th=make('th',cell);th.scope='col';row.append(th);}head.append(row);
   for(const cells of block.rows){const tr=make('tr');for(const cell of cells)tr.append(make('td',cell));body.append(tr);}
   table.append(head,body);region.append(table);target.append(region);
  }else target.append(make('p',block.text));
 }
}
