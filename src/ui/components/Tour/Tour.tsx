<div className={styles.TourBoxGradient}>
         <div className={styles.TourBox}>
           <div className="p-2 pt-3">
             {isNewUser ? (
               <div className={styles.intro}>
                 <p className={styles.h1}>Hello and welcome!</p>
                 {typeOfReplay === "events" ? (
                   <>
                     <p>
                       Replay is the first time-travel enabled DevTools. It’s designed to be
                       familiar, futuristic, and fun.
                     </p>
                     <p>To get started, click on DevTools in the top right.</p>
                   </>
                 ) : null}
               </div>
             ) : (
               <div className={styles.intro}>
                 {showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                   <>
                     <div className={styles.h1}>Time travel 🚀</div>
                     <p>Look underneath the video to find the Replay console.</p>
                     <p>
                       Hover over the console and you’ll see a fast-forward button. Click it to time
                       travel!
                     </p>
                   </>
                 )}

                 {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
                   <>
                     <div className={styles.h1}>
                       One-click logs
                       <svg className={styles.logPoint} viewBox="0 0 24 24" fill="currentColor">
                         <path d="M0 0h24v24H0z" fill="none"></path>
                         <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path>
                       </svg>
                     </div>
                     <p>Now click the plus button on a line of code to set a print statement.</p>
                   </>
                 )}

                 {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
                   <>
                     <div className={styles.h1}>One-click logs 🦄</div>
                     <p>You can pass anything you want here, including objects and variables.</p>
                     <p>Later we can even show you how to add a unicorn.</p>
                     <p>Type something here and hit enter.</p>
                   </>
                 )}

                 {hasCompletedTour && (
                   <>
                     <div className={styles.h1}>Check it out!</div>
                     <p>Take a look at the console.</p>
                     <p>
                       Replay just re-ran your recording and retroactively added your print statement
                       each time that line of code was called. 🤯
                     </p>
                     <p>And with that, you've graduated from the tour. Happy exploring!</p>
                     <p className="mt-8">
                       <a
                         href="#"
                         onClick={e => {
                           e.stopPropagation();
                           setShowConfetti(true);
                           setShowPassport(true);
                           setTimeout(() => {
                             setShowConfetti(false);
                             dismissTourNag();
                           }, 2500);
                         }}
                         className="px-3 py-1 font-medium bg-white rounded-lg shadow-lg hover:cursor-hand whitespace-nowrap text-primaryAccent hover:bg-blue-50"
                       >
                         Thanks!
                       </a>
                       {showConfetti ? <Confetti /> : null}
                     </p>
                     <img
                       src={`/images/passport/tour_grad-default.png`}
                       className={styles.largeCompletedImage}
                       style={{
                         zIndex: 0,
                         opacity: 0.75,
                         bottom: `300px`,
                         transform: `rotate(14deg)`,
                       }}
                     />
                   </>
                 )}
               </div>
             )}
           </div>
         </div>
       </div>
       <div className="absolute p-3 bottom-28">
         {isNewUser && (
           <div className="relative -bottom-3">
             <img src="/images/illustrations/larry_wave.png" className="w-full z-1" />
           </div>
         )}

         {!isNewUser && showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
           <img
             src="https://vercel.replay.io/tour/fast-forward.gif"
             className={styles.videoExample}
           />
         )}

         {!showConsoleNavigate && showBreakpointAdd && showBreakpointEdit && (
           <img src="https://vercel.replay.io/tour/addlogs.gif" className={styles.videoExample} />
         )}

         {!showConsoleNavigate && !showBreakpointAdd && showBreakpointEdit && (
           <img src="https://vercel.replay.io/tour/editlogs.gif" className={styles.videoExample} />
         )}

         {hasCompletedTour && (
           <img
             src="https://vercel.replay.io/tour/consoleupdate.gif"
             className={styles.videoExample}
           />
         )}
       </div>
     </div>