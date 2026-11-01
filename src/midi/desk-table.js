export function element(tag, text) { const node=document.createElement(tag); if(text!==undefined)node.textContent=String(text); return node; }
export function table(host, headings, rows) {
  host.replaceChildren();
  if (!rows.length) { host.append(element('p','None.')); return; }
  let page=0;
  const scroll=element('div');scroll.className='table-scroll';
  const grid=element('table'),head=element('thead'),header=element('tr'),body=element('tbody');
  for(const label of headings){const th=element('th',label);th.scope='col';header.append(th);}
  head.append(header);grid.append(head,body);scroll.append(grid);
  const nav=element('div');nav.className='pager';
  const back=element('button','Previous'),next=element('button','Next'),range=element('span');
  nav.append(back,range,next);host.append(scroll,nav);
  function draw(){
    body.replaceChildren();const start=page*50;
    for(const row of rows.slice(start,start+50)){const tr=element('tr');for(const value of row)tr.append(element('td',value));body.append(tr);}
    range.textContent=`${start+1}–${Math.min(start+50,rows.length)} of ${rows.length}`;
    back.disabled=page===0;next.disabled=start+50>=rows.length;nav.hidden=rows.length<=50;
  }
  back.onclick=()=>{page--;draw();};next.onclick=()=>{page++;draw();};draw();
}
