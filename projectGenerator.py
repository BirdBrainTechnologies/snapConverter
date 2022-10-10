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
<script x="152" y="13">
    <block s="receiveGo"></block>
    <block s="doApplyExtension">
        <l>src_load(url)</l>
        <list>
            <l>libraries/bbtSnapExtension.js</l>
        </list>
    </block>
</script>
'''
stop_scripts = '''
<script x="29" y="22">
<block s="receiveInteraction">
<l>
<option>stopped</option>
</l>
</block>
<custom-block s="stop all %txt">
<l>A</l>
</custom-block>
</script>
<script x="188" y="24">
<block s="receiveInteraction">
<l>
<option>stopped</option>
</l>
</block>
<custom-block s="stop all %txt">
<l>B</l>
</custom-block>
</script>
<script x="347" y="19">
<block s="receiveInteraction">
<l>
<option>stopped</option>
</l>
</block>
<custom-block s="stop all %txt">
<l>C</l>
</custom-block>
</script>
'''

def get_blocks_from_xml(filename):
    file = open(components_prefix + filename, 'r')
    text = file.read()
    #text = text.replace("<blocks[^>]*>", "")
    #text = text.replace("<blocks.*?>", "")
    text = re.sub("<blocks.*?>", "", text)
    text = text.replace("</blocks>", "")
    return text

def multi_to_single(blocks_text):
    blocks_text = blocks_text.replace("%&apos;devId&apos; ", "") #remove dev dropdown
    blocks_text = blocks_text.replace("<input type=\"%txt\" readonly=\"true\">A<options>A&#xD;B&#xD;C</options></input>", "") #remove dropdown options
    blocks_text = blocks_text.replace("<block var=\"devId\"/>","<l>A</l>") #replace use of the var with dev A
    return blocks_text

def write_to_file(filename, text):
    path = output_prefix + filename
    if os.path.exists(path):
        os.remove(path)
    target = open(path, 'w')
    target.write(text)

def insert_blocks(project, blocks):
    return project.replace("<blocks></blocks>", "<blocks>" + blocks + "</blocks>", 1)

def generate_projects():
    project_file = open(components_prefix + "Project.xml", 'r')
    project_text = project_file.read()
    HB_multi_blocks = get_blocks_from_xml("hummingbirdBitBlocks.xml")
    HB_multi_project = insert_blocks(project_text, HB_multi_blocks)
    write_to_file("WebHummingbirdMultiDevice.xml", HB_multi_project)

generate_projects()
