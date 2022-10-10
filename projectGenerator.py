import re
import os

my_path = os.path.dirname(os.path.realpath(__file__))
output_prefix = my_path + "/output/"
components_prefix = my_path + "/components/"
project_file = "Project.xml"
microbit_blocks_file = "microbitBlocks.xml"
finch2_blocks_file = "finch2Blocks.xml"
hummingbirdbit_blocks_file = "hummingbirdBitBlocks.xml"
legacy_blocks_file = "legacyBlocks.xml"
extension_script = '''
            <script x="20" y="20">
                <block s="receiveGo"></block>
                <block s="doApplyExtension">
                    <l>src_load(url)</l>
                    <list>
                        <l>libraries/bbtSnapExtension.js</l>
                    </list>
                </block>
            </script>
'''
stop_multi_scripts = '''
            <script x="20" y="100">
                <block s="receiveInteraction">
                    <l><option>stopped</option></l>
                </block>
                <custom-block s="stop all %txt">
                    <l>A</l>
                </custom-block>
            </script>
            <script x="170" y="100">
                <block s="receiveInteraction">
                    <l><option>stopped</option></l>
                </block>
                <custom-block s="stop all %txt">
                    <l>B</l>
                </custom-block>
            </script>
            <script x="320" y="100">
                <block s="receiveInteraction">
                    <l><option>stopped</option></l>
                </block>
                <custom-block s="stop all %txt">
                    <l>C</l>
                </custom-block>
            </script>
        '''
stop_single_script = '''
            <script x="20" y="100">
                <block s="receiveInteraction">
                    <l><option>stopped</option></l>
                </block>
                <custom-block s="stop all"></custom-block>
            </script>
        '''

def get_blocks_from_xml(filename):
    file = open(components_prefix + filename, 'r')
    text = file.read()
    text = re.sub("<blocks.*?>", "", text)
    text = text.replace("</blocks>", "")
    return text

def multi_to_single(blocks_text):
    blocks_text = blocks_text.replace("%&apos;devId&apos; ", "") #remove dev dropdown
    blocks_text = blocks_text.replace("<input type=\"%txt\" readonly=\"true\">A<options>A&#xD;B&#xD;C</options></input>", "") #remove dropdown options
    blocks_text = blocks_text.replace("<block var=\"devId\"/>","<l>A</l>") #replace use of the var with dev A
    return blocks_text

def write_project(projectname, text):
    text = text.replace("<project name=\"PROJECT_NAME\"", "<project name=\"" + projectname + "\"")
    text = text.replace("<scene name=\"PROJECT_NAME\">", "<scene name=\"" + projectname + "\">")
    path = output_prefix + projectname + ".xml"
    if os.path.exists(path):
        os.remove(path)
    target = open(path, 'w')
    target.write(text)

def insert_details(project, blocks, scripts):
    project = project.replace("<blocks></blocks>", "<blocks>" + blocks + "</blocks>", 1)
    project = project.replace("<scripts></scripts>", "<scripts>" + scripts + "</scripts>", 1)
    return project

def generate_projects():
    project_file = open(components_prefix + "Project.xml", 'r')
    project_text = project_file.read()

    mb_multi_Blocks = get_blocks_from_xml("microbitBlocks.xml")
    HB_multi_blocks = get_blocks_from_xml("hummingbirdBitBlocks.xml")
    Finch_multi_blocks = get_blocks_from_xml("finch2Blocks.xml")

    HB_multi_project = insert_details(project_text, HB_multi_blocks + mb_multi_Blocks, extension_script + stop_multi_scripts)
    write_project("WebHummingbirdMultiDevice", HB_multi_project)
    HB_single_project = insert_details(project_text, multi_to_single(HB_multi_blocks + mb_multi_Blocks), extension_script + stop_single_script)
    write_project("WebHummingbirdSingleDevice", HB_single_project)

    Finch_multi_project = insert_details(project_text, Finch_multi_blocks + mb_multi_Blocks, extension_script + stop_multi_scripts)
    write_project("WebFinchMultiDevice", Finch_multi_project)
    Finch_single_project = insert_details(project_text, multi_to_single(Finch_multi_blocks + mb_multi_Blocks), extension_script + stop_single_script)
    write_project("WebFinchSingleDevice", Finch_single_project)

    mixed_multi_project = insert_details(project_text, HB_multi_blocks + Finch_multi_blocks + mb_multi_Blocks, extension_script + stop_multi_scripts)
    write_project("WebMixedMultiDevice", mixed_multi_project)


generate_projects()
