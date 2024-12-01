'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { FolderIcon, CodeIcon, ServerIcon, CloudFog } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MACHINES = [
  {
    name: 'Ubuntu20.04',
    image: 'ubuntu:20.04',
    enabled: true,
  },
  {
    name: 'Ubuntu22.04',
    image: 'ubuntu:22.04',
    enabled: true,
  },
  {
    name: 'Ubuntu24.04',
    image: 'ubuntu:24.04',
    enabled: true,
  },
  {
    name: 'Ubuntu24.10',
    image: 'ubuntu:24.10',
    enabled: true,
  },
  {
    name: 'Ubuntu25.04',
    image: 'ubuntu:25.04',
    enabled: true,
  },
  {
    name: 'DebianBullseye',
    image: 'debian:bullseye',
    enabled: true,
  },
  {
    name: 'DebianBookworm',
    image: 'debian:bookworm',
    enabled: true,
  },
  {
    name: 'OracleLinux9',
    image: 'oraclelinux:9',
    enabled: true,
  },
  {
    name: 'OracleLinux8.10',
    image: 'oraclelinux:8.10',
    enabled: true,
  },
  {
    name: 'OracleLinux8',
    image: 'oraclelinux:8',
    enabled: true,
  },
  {
    name: 'AmazonLinux2023',
    image: 'amazonlinux:2023',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machines: MACHINES.map(machine => machine.name),
      language: 'python',
      entryPoint: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const formData = new FormData();

    console.log(JSON.stringify(values.machines));

    files.forEach((file) => {
      formData.append('files', file);
    });

    formData.append('machines', JSON.stringify(values.machines));
    formData.append('language', values.language);
    formData.append('entryPoint', values.entryPoint);

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
        if (data.path) {
          const link = `http://localhost:8000/public/${data.path}`;
          setDownloadLink(link);
          console.log('Performance metrics generated:', data);
          setTimeout(() => {
            router.push('/metrics');
          }, 2000);
        }
      })
      .catch((error) => {
        console.error('Error:', error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <div className='min-h-screen bg-white p-4'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-7xl mx-auto'
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid grid-cols-1 md:grid-cols-2 gap-6'
          >
            <FormField
              control={form.control}
              name='files'
              render={({ field }) => (
                <FormItem className='col-span-1 md:col-span-2'>
                  <FormLabel className='text-gray-700 text-lg font-semibold'>
                    Select Folder
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
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
                        className='text-purple-600 bg-gradient-to-r from-pink-50 to-purple-100 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-500'
                      />
                      <FolderIcon className='absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500' />
                    </div>
                  </FormControl>
                  <FormDescription className='text-purple-500'>
                    Select the folder containing your project files
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {files.length > 0 && (
              <div className='text-purple-600 bg-gradient-to-r from-pink-50 to-purple-100 p-3 rounded-md col-span-1 md:col-span-2'>
                <strong>Selected Folder:</strong>{' '}
                {files[0].webkitRelativePath.split('/')[0]}
              </div>
            )}
            <FormField
              control={form.control}
              name='machines'
              render={() => (
                <FormItem className='col-span-1 md:col-span-2'>
                  <FormLabel className='text-gray-700 text-lg font-semibold'>
                    Select Machines
                  </FormLabel>
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
                            <FormLabel className='text-purple-600 font-normal'>
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
                <FormItem className='col-span-1 md:col-span-2'>
                  <FormLabel className='text-gray-700 text-lg font-semibold'>
                    Language
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className='bg-gradient-to-r from-pink-50 to-purple-100 text-purple-600'>
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
                <FormItem className='col-span-1 md:col-span-2'>
                  <FormLabel className='text-gray-700 text-lg font-semibold'>
                    Entry Point
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        placeholder='e.g., main.py'
                        {...field}
                        className='text-purple-600 bg-gradient-to-r from-pink-50 to-purple-100 border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-500'
                      />
                      <CodeIcon className='absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500' />
                    </div>
                  </FormControl>
                  <FormDescription className='text-purple-500'>
                    The main file of your application
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='col-span-1 md:col-span-2'>
              <AnimatePresence>
                {isSubmitting ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='flex justify-center items-center'
                  >
                    <ServerIcon className='animate-pulse text-purple-600 w-8 h-8' />
                  </motion.div>
                ) : (
                  <>
                    {downloadLink && (
                      <Button
                        as='a'
                        href={downloadLink}
                        download
                        target='_blank'
                        rel='noopener noreferrer'
                        className='w-full text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                      >
                        Download
                      </Button>
                    )}
                    <Button
                      type='submit'
                      className='w-full mt-4 text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
                    >
                      Submit
                    </Button>
                  </>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
