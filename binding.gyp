{
  'targets': [
    {
      'include_dirs':[
        '<(module_root_dir)/node_modules/nan',
      ],
      'target_name': 'syslog',
      'sources': [ 'src/syslog.cc' ]
    }
  ]
}
