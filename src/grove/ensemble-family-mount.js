/** Build the picture before replacing sound, then install it only for a current,
 * successful mount. A suspended mount still owns the new instruments. */
export async function mountEnsembleFamily({host,groves,preparePicture,installPicture,isCurrent}){
 const candidate=preparePicture(groves);
 let installed=false;
 try{
  await host.enable(groves);
  // The caller parks or supersedes the host when invalidating this operation;
  // a stale candidate must never overwrite the newer operation's picture.
  if(!isCurrent()||!['ready','suspended'].includes(host.state))return false;
  installPicture(candidate,groves);installed=true;
  return true;
 }finally{if(!installed)candidate?.dispose();}
}
