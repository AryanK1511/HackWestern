'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

const MACHINES = [
  {
    name: 'Ubuntu20.04',
    image: 'ubuntu:20.04',
    enabled: true,
  },
  {
    name: 'Debian11',
    image: 'debian:bullseye',
    enabled: true,
  },
];

const formSchema = z.object({
  files: z.array(z.any()).min(1, 'At least one file is required'),
  machines: z.array(z.string()).min(1, 'Select at least one machine'),
  language: z.enum(['python', 'javascript']),
  entryPoint: z.string().min(1, 'Entry point is required'),
});

export default function UploadForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machines: [],
      language: 'python',
      entryPoint: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();

    // Append all files to formData
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Convert machines to JSON string
    formData.append('machines', JSON.stringify(values.machines));
    formData.append('language', values.language);
    formData.append('entryPoint', values.entryPoint);

    // Backend URL (adjust as needed)
    const backendURL = 'http://localhost:8000/upload';

    fetch(backendURL, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Assuming the backend returns a path to the CSV
        if (data.path) {
          // Construct the download link (adjust the base URL as needed)
          const link = `http://localhost:8000/public/${data.path}`;
          setDownloadLink(link);
          console.log('Performance metrics generated:', data);
        }
      })
      .catch((error) => {
        console.error('Error:', error.message);
      });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800'
    >
      <div className='bg-white bg-opacity-10 p-8 rounded-xl shadow-2xl backdrop-blur-lg w-full max-w-md'>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className='text-3xl font-bold text-center text-white mb-6'
        >
          Tin Studio
        </motion.h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='files'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-white'>Select Files</FormLabel>
                  <FormControl>
                    <Input
                      type='file'
                      webkitdirectory='true'
                      multiple
                      onChange={(e) => {
                        const selectedFiles = e.target.files;
                        if (selectedFiles) {
                          const fileArray = Array.from(selectedFiles);
                          setFiles(fileArray);
                          form.setValue('files', fileArray);
                          form.clearErrors('files');
                        }
                      }}
                      className='text-white bg-white bg-opacity-20 border-none'
                    />
                  </FormControl>
                  <FormDescription className='text-gray-300'>
                    Select the files you want to upload
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='text-white'>
              <strong>Selected Files:</strong>{' '}
              {files.length > 0
                ? files.map((file) => file.name).join(', ')
                : 'None'}
            </div>
            <FormField
              control={form.control}
              name='machines'
              render={() => (
                <FormItem>
                  <FormLabel className='text-white'>Select Machines</FormLabel>
                  <div className='space-y-2'>
                    {MACHINES.map((machine) => (
                      <FormField
                        key={machine.name}
                        control={form.control}
                        name='machines'
                        render={({ field }) => (
                          <FormItem
                            key={machine.name}
                            className='flex flex-row items-start space-x-3 space-y-0'
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(machine.name)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...field.value,
                                        machine.name,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== machine.name
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className='text-white font-normal'>
                              {machine.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='language'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-white'>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className='bg-white bg-opacity-20 border-none text-white'>
                        <SelectValue placeholder='Select a language' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='python'>Python</SelectItem>
                      <SelectItem value='javascript'>JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='entryPoint'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-white'>Entry Point</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g., main.py'
                      {...field}
                      className='text-white bg-white bg-opacity-20 border-none'
                    />
                  </FormControl>
                  <FormDescription className='text-gray-300'>
                    The main file of your application
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
            >
              Submit
            </Button>

            {downloadLink && (
              <div className='mt-4 text-center'>
                <a
                  href={downloadLink}
                  download
                  className='text-blue-300 hover:text-blue-200 underline'
                >
                  Download Performance Metrics CSV
                </a>
              </div>
            )}
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
