# snapConverter

The script in this repo generates all the snap! project files provided by BirdBrain
Technologies. Changes needed in these files should be made here and new projects
generated.

To make a change to existing snap! blocks, follow the following steps:
1. Make your change to the corresponding block in the components directory.
2. Run the script projectGenerator.py to generate new project xml files.
3. Upload copies of the corrected files to the BirdBrain snap account.
4. Update the offline versions of the project files in the Web Apps and BlueBird
Connector.



The old converters (now in the oldConverters folder) were designed to translate
between the web app version and bluebird or robotserver version. This is no longer
necessary. See the README in the oldConverters folder for more details.
