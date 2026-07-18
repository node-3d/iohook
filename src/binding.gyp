{
	'variables': {
		'bin': '<!(node -e "import(\'@node-3d/addon-tools\').then((m) => m.printBin())")',
		'uio_include': '<!(node -p "require(\'@node-3d/deps-uiohook\').include")',
		'uio_bin': '<!(node -p "require(\'@node-3d/deps-uiohook\').bin")',
	},
	'targets': [{
		'target_name': 'iohook',
		'includes': ['common.gypi'],
		'sources': [
			'cpp/bindings.cpp',
			'cpp/iohook.cpp',
			'cpp/hook-worker.cpp',
		],
		'include_dirs': [
			'<(uio_include)',
			'<!@(node -e "import(\'@node-3d/addon-tools\').then((m) => m.printInclude())")',
		],
		'cflags_cc': ['-std=c++17', '-fno-exceptions'],
		'cflags': ['-fno-exceptions'],
		'library_dirs': ['<(uio_bin)'],
		'conditions': [
			['OS=="linux"', {
				'cflags_cc': ['-w'],
				'libraries': [
					"-Wl,-rpath,'$$ORIGIN'",
					"-Wl,-rpath,'$$ORIGIN/../node_modules/@node-3d/deps-uiohook/<(bin)'",
					"-Wl,-rpath,'$$ORIGIN/../../@node-3d/deps-uiohook/<(bin)'",
					'-luiohook', '-lX11', '-lXt', '-lxcb', '-lX11-xcb', '-lxkbcommon', '-lxkbcommon-x11', '-lXtst',
				],
				'defines': ['__linux__', 'USE_XKBCOMMON'],
			}],
			['OS=="mac"', {
				'cflags_cc': ['-w'],
				'libraries': [
					'-Wl,-rpath,@loader_path',
					'-Wl,-rpath,@loader_path/../node_modules/@node-3d/deps-uiohook/<(bin)',
					'-Wl,-rpath,@loader_path/../../@node-3d/deps-uiohook/<(bin)',
					'-luiohook', '-lobjc',
					'-framework IOKit', '-framework Carbon', '-framework ApplicationServices',
				],
				'xcode_settings': {
					'DYLIB_INSTALL_NAME_BASE': '@rpath',
				},
				'MACOSX_DEPLOYMENT_TARGET': '13.5',
				'defines': ['__APPLE__', 'USE_IOKIT=1', 'USE_OBJC=1'],
				'CLANG_CXX_LIBRARY': 'libc++',
				'OTHER_CFLAGS': ['-std=c++17', '-fno-exceptions'],
			}],
			['OS=="win"', {
				'libraries': [
					'-luiohook',
				],
				'defines': ['WIN32_LEAN_AND_MEAN', 'VC_EXTRALEAN', '_WIN32', '_HAS_EXCEPTIONS=0'],
				'msvs_settings' : {
					'VCCLCompilerTool' : {
						'AdditionalOptions' : [
							'/O2','/Oy','/GL','/GF','/Gm-', '/std:c++17',
							'/EHa-s-c-','/MT','/GS','/Gy','/GR-','/Gd',
						]
					},
					'VCLinkerTool' : {
						'AdditionalOptions' : ['/DEBUG:NONE', '/LTCG', '/OPT:NOREF'],
					},
				},
			}],
		],
	}]
}
