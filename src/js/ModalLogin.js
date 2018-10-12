
export function modalLog(id, Uri, unifSrv, serviceName, resolve, reject) {
    //Layer that contains all
    var mBase=document.createElement("div");
    mBase.className="esmodal"; 
    mBase.id=id;
    //Layer child for contain a header, container and footer
    var mBody =document.createElement("div");
    mBody.className="panel";
    // Title div with a close (x) button
    var mTitle=document.createElement("div");
    mTitle.className = "title";
    mTitle.innerHTML = "Login";
    var mCloseKey=document.createElement("div");
    mCloseKey.className="close";
    mCloseKey.innerHTML='X';
     //X button (top right corner) remove the main layer,  and children
    mCloseKey.addEventListener('click',function(ev) {
          ev.preventDefault();
          var dTop=this.parentNode.parentNode;
          dTop.remove(); 
         });
    //Layre that will contain and iframe with the login webpage
    var mCont=document.createElement("div");
    mCont.className="content";
    var mFrame = document.createElement("iframe")
    mFrame.setAttribute('scrolling','no');
    mFrame.inlogin = 0;  
    //A bit tricky? First time iframe is open with about:blank, second with loginform, third with form action retrun page, 
    // So the win logn must be closed after second load.
    mFrame.addEventListener('load', function(){
        if (this.inlogin<2)
            this.inlogin++
        else{
            mCloseKey.click();
           }
        });

    //Foot layer for close button
    var mFoot=document.createElement("div");
    mFoot.className="footer";
        var bCancel=document.createElement("button");
    bCancel.className = "button";
    bCancel.innerHTML = 'close';
    bCancel.addEventListener('click',function(ev) {
         ev.preventDefault();
         mBase.classList.remove("visible");
         mCloseKey.click();
     });
     /*
        Finally add children to their parents (mBody is the main layer)
          mBody to mBase, 
          mCont, mFooter, mCloseKey to mBody
          mFrame to mCont
          mBase to document
    */
    mBody.appendChild(mTitle); 
    mBody.appendChild(mCloseKey);      
    mCont.appendChild(mFrame);
    mBody.appendChild(mCont); 
    mFoot.appendChild(bCancel);
    mBody.appendChild(mFoot);
    mBase.appendChild(mBody);
    document.body.appendChild(mBase);
    //delay a bit the layer appears, jsut esthetic
    setTimeout(function(){
     mBase.classList.add("visible");
     },50);
//return the window inside iframe
return   (mFrame.contentWindow || mFrame.contentDocument)
}
