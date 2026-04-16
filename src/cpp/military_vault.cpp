#include <iostream>
#include <fstream>
#include <string>

using namespace std;

int main(int argc, char* argv[]) {
    // We expect at least 3 arguments: program name, derived key, and file_path
    // Optionally a 4th argument: --mode=aes-256-ctr
    if (argc < 3) {
        cerr << "Error: Missing arguments. Usage: military_vault <derived_key> <file_path> [--mode=aes-256-ctr]" << endl;
        return 1;
    }

    string derived_key = argv[1];
    string file_path = argv[2];
    string mode = (argc >= 4) ? argv[3] : "default";

    // Create a mock encrypted output file path
    string output_file_path = file_path + ".crypt";

    // Simulate writing the encrypted bitstream
    ofstream outfile(output_file_path);
    if (outfile.is_open()) {
        outfile << "MOCK_ENCRYPTED_BITSTREAM_WITH_AES_256_CTR_AND_KEY_" << derived_key << endl;
        outfile.close();
    } else {
        cerr << "Error: Could not write output file." << endl;
        return 1;
    }

    int mock_frame_count = 1337;

    // Print to stdout in JSON format for the Node.js API to parse
    cout << "{" << endl;
    cout << "  \"frameCount\": " << mock_frame_count << "," << endl;
    cout << "  \"outputPath\": \"" << output_file_path << "\"," << endl;
    cout << "  \"mode\": \"" << mode << "\"" << endl;
    cout << "}" << endl;

    return 0;
}
