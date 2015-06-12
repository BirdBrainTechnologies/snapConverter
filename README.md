# snapConverter
This is the source code for two webapps that convert snap projects for the finch and hummingbird. This is needed because projects can be made in two different ways (chrome app and birdbrainserver/iPad).

Inside the hummingbird and finch folder of this directory you will see an app and a dist folder. The app folder contains the unformatted code for the websites and the dist folder contains the formatted code. 
The dist folder should be used for distribution. 

In the finch's app/dist folder you will notice 8 xml documents. These are what the app uses to make the conversion. These are the base projects for the finch for both the chrome app and the http server (birdbrain server/iPad). The number at the end of the file name indicates what level of snap the project is and the files without a number are normal snap with finch support. 

If the starter projects were to change, simply replace the xml files with updated xml files. However, in order for the converter to work, the http and chrome version of a block need to have the same name and the same parameter names. Essentially the very upper block of your custom block should look EXACTLY the same in both versions. 

This also applies to the hummingbird's app/dist folder except there are only 2 xml files as there are no levels for the hummingbird.
